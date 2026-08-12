import { betterAuth } from "better-auth";

// =========================================
// HEGEVA AI V4.7.2
// Auth + Cloud Workspace + Plans + AI Usage
// Improved multilingual AI responses
// =========================================

const PLAN_LIMITS = {
  basic: 50,
  premium: 300,
  pro: 1000
};

function createAuth(env, request) {
  const origin = new URL(request.url).origin;

  return betterAuth({
    database: env.DB,
    secret: env.BETTER_AUTH_SECRET,
    baseURL: origin,

    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      autoSignIn: true
    },

    user: { modelName: "user" },
    session: { modelName: "session" },
    account: { modelName: "account" },
    verification: { modelName: "verification" }
  });
}

async function getLoggedInUser(request, env) {
  const auth = createAuth(env, request);

  const session = await auth.api.getSession({
    headers: request.headers
  });

  return session?.user || null;
}

function validWorkspaceType(type) {
  return /^[a-z0-9_-]{1,40}$/i.test(type);
}

function getCurrentPeriod() {
  const now = new Date();

  const year = now.getUTCFullYear();

  const month = String(
    now.getUTCMonth() + 1
  ).padStart(2, "0");

  return `${year}-${month}`;
}

async function ensureUserPlan(env, userId) {
  const now = new Date().toISOString();

  await env.DB
    .prepare(`
      INSERT INTO user_plans (
        userId,
        plan,
        createdAt,
        updatedAt
      )
      VALUES (
        ?1,
        'basic',
        ?2,
        ?2
      )
      ON CONFLICT(userId)
      DO NOTHING
    `)
    .bind(
      userId,
      now
    )
    .run();
}

async function getUserPlan(env, userId) {
  await ensureUserPlan(
    env,
    userId
  );

  const row = await env.DB
    .prepare(`
      SELECT
        plan,
        createdAt,
        updatedAt
      FROM user_plans
      WHERE userId = ?1
      LIMIT 1
    `)
    .bind(userId)
    .first();

  const plan =
    row?.plan &&
    Object.prototype.hasOwnProperty.call(
      PLAN_LIMITS,
      row.plan
    )
      ? row.plan
      : "basic";

  return {
    plan,
    limit: PLAN_LIMITS[plan],
    createdAt: row?.createdAt || null,
    updatedAt: row?.updatedAt || null
  };
}

async function getAIUsage(
  env,
  userId,
  period
) {
  const row = await env.DB
    .prepare(`
      SELECT
        aiMessages,
        createdAt,
        updatedAt
      FROM ai_usage
      WHERE userId = ?1
        AND period = ?2
      LIMIT 1
    `)
    .bind(
      userId,
      period
    )
    .first();

  return {
    aiMessages:
      Number.isFinite(
        Number(row?.aiMessages)
      )
        ? Number(row.aiMessages)
        : 0,

    createdAt:
      row?.createdAt || null,

    updatedAt:
      row?.updatedAt || null
  };
}

async function incrementAIUsage(
  env,
  userId,
  period
) {
  const now = new Date().toISOString();

  await env.DB
    .prepare(`
      INSERT INTO ai_usage (
        userId,
        period,
        aiMessages,
        createdAt,
        updatedAt
      )
      VALUES (
        ?1,
        ?2,
        1,
        ?3,
        ?3
      )

      ON CONFLICT(
        userId,
        period
      )

      DO UPDATE SET
        aiMessages =
          ai_usage.aiMessages + 1,

        updatedAt =
          excluded.updatedAt
    `)
    .bind(
      userId,
      period,
      now
    )
    .run();
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // =========================================
    // BETTER AUTH
    // =========================================

    if (
      url.pathname.startsWith(
        "/api/auth/"
      )
    ) {
      try {
        const auth =
          createAuth(
            env,
            request
          );

        return await auth.handler(
          request
        );
      } catch (error) {
        console.error(
          "HEGEVA Auth error:",
          error
        );

        return Response.json(
          {
            error:
              "Authentication service temporarily unavailable."
          },
          {
            status: 500
          }
        );
      }
    }

    // =========================================
    // PLAN STATUS
    // =========================================

    if (
      url.pathname ===
      "/api/plan/status"
    ) {
      if (
        request.method !==
        "GET"
      ) {
        return Response.json(
          {
            error:
              "Method not allowed."
          },
          {
            status: 405
          }
        );
      }

      try {
        const user =
          await getLoggedInUser(
            request,
            env
          );

        if (!user) {
          return Response.json(
            {
              error:
                "Authentication required."
            },
            {
              status: 401
            }
          );
        }

        const period =
          getCurrentPeriod();

        const planInfo =
          await getUserPlan(
            env,
            user.id
          );

        const usage =
          await getAIUsage(
            env,
            user.id,
            period
          );

        const remaining =
          Math.max(
            0,
            planInfo.limit -
              usage.aiMessages
          );

        return Response.json({
          ok: true,

          plan:
            planInfo.plan,

          period,

          usage: {
            aiMessages:
              usage.aiMessages,

            limit:
              planInfo.limit,

            remaining
          }
        });
      } catch (error) {
        console.error(
          "HEGEVA plan status error:",
          error
        );

        return Response.json(
          {
            error:
              "Plan information is temporarily unavailable."
          },
          {
            status: 500
          }
        );
      }
    }

    // =========================================
    // CLOUD WORKSPACE
    // =========================================

    if (
      url.pathname.startsWith(
        "/api/workspace/"
      )
    ) {
      try {
        const user =
          await getLoggedInUser(
            request,
            env
          );

        if (!user) {
          return Response.json(
            {
              error:
                "Authentication required."
            },
            {
              status: 401
            }
          );
        }

        const rawType =
          url.pathname
            .slice(
              "/api/workspace/".length
            )
            .trim();

        let dataType;

        try {
          dataType =
            decodeURIComponent(
              rawType
            );
        } catch {
          return Response.json(
            {
              error:
                "Invalid workspace type."
            },
            {
              status: 400
            }
          );
        }

        if (
          !validWorkspaceType(
            dataType
          )
        ) {
          return Response.json(
            {
              error:
                "Invalid workspace type."
            },
            {
              status: 400
            }
          );
        }

        // =====================================
        // LOAD CLOUD DATA
        // =====================================

        if (
          request.method ===
          "GET"
        ) {
          const row =
            await env.DB
              .prepare(`
                SELECT
                  id,
                  dataType,
                  data,
                  createdAt,
                  updatedAt
                FROM workspace_data
                WHERE userId = ?1
                  AND dataType = ?2
                LIMIT 1
              `)
              .bind(
                user.id,
                dataType
              )
              .first();

          if (!row) {
            return Response.json({
              found: false,
              dataType,
              data: null
            });
          }

          let parsedData = null;

          try {
            parsedData =
              JSON.parse(
                row.data
              );
          } catch {}

          return Response.json({
            found: true,
            id: row.id,
            dataType:
              row.dataType,
            data:
              parsedData,
            createdAt:
              row.createdAt,
            updatedAt:
              row.updatedAt
          });
        }

        // =====================================
        // SAVE CLOUD DATA
        // =====================================

        if (
          request.method ===
          "PUT"
        ) {
          let body;

          try {
            body =
              await request.json();
          } catch {
            return Response.json(
              {
                error:
                  "Invalid JSON body."
              },
              {
                status: 400
              }
            );
          }

          if (
            !body ||
            !Object.prototype.hasOwnProperty.call(
              body,
              "data"
            )
          ) {
            return Response.json(
              {
                error:
                  "The request must contain a data field."
              },
              {
                status: 400
              }
            );
          }

          let serializedData;

          try {
            serializedData =
              JSON.stringify(
                body.data
              );
          } catch {
            return Response.json(
              {
                error:
                  "Workspace data could not be serialized."
              },
              {
                status: 400
              }
            );
          }

          if (
            serializedData.length >
            250000
          ) {
            return Response.json(
              {
                error:
                  "Workspace data is too large."
              },
              {
                status: 413
              }
            );
          }

          const now =
            new Date()
              .toISOString();

          const id =
            crypto.randomUUID();

          await env.DB
            .prepare(`
              INSERT INTO workspace_data (
                id,
                userId,
                dataType,
                data,
                createdAt,
                updatedAt
              )
              VALUES (
                ?1,
                ?2,
                ?3,
                ?4,
                ?5,
                ?6
              )

              ON CONFLICT(
                userId,
                dataType
              )

              DO UPDATE SET
                data =
                  excluded.data,

                updatedAt =
                  excluded.updatedAt
            `)
            .bind(
              id,
              user.id,
              dataType,
              serializedData,
              now,
              now
            )
            .run();

          return Response.json({
            ok: true,
            dataType,
            updatedAt: now
          });
        }

        return Response.json(
          {
            error:
              "Method not allowed."
          },
          {
            status: 405
          }
        );
      } catch (error) {
        console.error(
          "HEGEVA workspace error:",
          error
        );

        return Response.json(
          {
            error:
              "Cloud workspace is temporarily unavailable."
          },
          {
            status: 500
          }
        );
      }
    }

    // =========================================
    // HEGEVA AI CHAT V4.7.2
    // =========================================

    if (
      url.pathname ===
      "/api/chat"
    ) {
      if (
        request.method !==
        "POST"
      ) {
        return Response.json(
          {
            error:
              "Method not allowed"
          },
          {
            status: 405
          }
        );
      }

      try {
        // =====================================
        // LOGIN CHECK
        // =====================================

        const user =
          await getLoggedInUser(
            request,
            env
          );

        if (!user) {
          return Response.json(
            {
              error:
                "Authentication required.",

              code:
                "AUTH_REQUIRED"
            },
            {
              status: 401
            }
          );
        }

        // =====================================
        // PLAN + MONTHLY USAGE
        // =====================================

        const period =
          getCurrentPeriod();

        const planInfo =
          await getUserPlan(
            env,
            user.id
          );

        const usage =
          await getAIUsage(
            env,
            user.id,
            period
          );

        if (
          usage.aiMessages >=
          planInfo.limit
        ) {
          return Response.json(
            {
              error:
                "Monthly AI message limit reached.",

              code:
                "AI_LIMIT_REACHED",

              plan:
                planInfo.plan,

              period,

              usage: {
                aiMessages:
                  usage.aiMessages,

                limit:
                  planInfo.limit,

                remaining: 0
              }
            },
            {
              status: 429
            }
          );
        }

        // =====================================
        // REQUEST BODY
        // =====================================

        let body;

        try {
          body =
            await request.json();
        } catch {
          return Response.json(
            {
              error:
                "Invalid JSON body."
            },
            {
              status: 400
            }
          );
        }

        const message =
          typeof body.message ===
          "string"
            ? body.message.trim()
            : "";

        if (!message) {
          return Response.json(
            {
              error:
                "Please enter a message."
            },
            {
              status: 400
            }
          );
        }

        if (
          message.length >
          2500
        ) {
          return Response.json(
            {
              error:
                "Message is too long."
            },
            {
              status: 400
            }
          );
        }

        // =====================================
        // MODES
        // =====================================

        const modeInstructions = {
          general:
            "Give practical, useful and natural business help.",

          time:
            "Focus on repetitive work, admin bottlenecks and realistic ways to save time.",

          planner:
            "Help prioritise tasks and create a realistic, easy-to-follow action plan.",

          documents:
            "Help create professional wording, emails and document structures. Do not claim legal validity.",

          ideas:
            "Act as a practical idea partner. Give useful options, trade-offs and ways to test ideas without promising results.",

          decision:
            "Compare options clearly and neutrally, including benefits, drawbacks, risks and important assumptions.",

          meeting:
            "Turn meeting information into a concise summary, decisions, open questions and clear action items.",

          thirty:
            "Create a realistic 30-day action plan with weekly stages and measurable tasks, without promising outcomes."
        };

        const languageNames = {
          en: "English",
          hu: "Hungarian",
          de: "German",
          fr: "French",
          es: "Spanish"
        };

        const languageStyles = {
          en:
            "Use natural modern English. Be friendly, clear and practical. Avoid stiff or overly formal wording.",

          hu:
            "Használj természetes, mai magyar nyelvet. Beszélj közvetlenül, érthetően és barátságosan. Kerüld a furcsa szó szerinti fordításokat és a merev megfogalmazást.",

          de:
            "Use natural modern German. Be clear, friendly and practical. Avoid unnatural literal translations.",

          fr:
            "Use natural modern French. Be clear, friendly and conversational. Avoid robotic or literal translation-style wording.",

          es:
            "Use natural modern Spanish. Be clear, friendly and conversational. Avoid robotic or overly literal wording."
        };

        const mode =
          Object.prototype.hasOwnProperty.call(
            modeInstructions,
            body.mode
          )
            ? body.mode
            : "general";

        const language =
          Object.prototype.hasOwnProperty.call(
            languageNames,
            body.language
          )
            ? body.language
            : "en";

        const businessContext =
          typeof body.businessContext ===
          "string"
            ? body.businessContext
                .slice(0, 500)
                .trim()
            : "";

        // =====================================
        // SAFE CONVERSATION HISTORY
        // =====================================

        const rawHistory =
          Array.isArray(
            body.history
          )
            ? body.history.slice(-10)
            : [];

        let totalChars = 0;

        const safeHistory = [];

        for (
          const item of rawHistory
        ) {
          if (
            !item ||
            ![
              "user",
              "assistant"
            ].includes(
              item.role
            ) ||
            typeof item.content !==
              "string"
          ) {
            continue;
          }

          const content =
            item.content
              .slice(0, 1200)
              .trim();

          if (!content) {
            continue;
          }

          if (
            totalChars +
              content.length >
            7000
          ) {
            break;
          }

          totalChars +=
            content.length;

          safeHistory.push({
            role: item.role,
            content
          });
        }

        // =====================================
        // SYSTEM PROMPT V4.7.2
        // =====================================

        const systemPrompt = `
You are HEGEVA AI, a practical and friendly AI business companion.

You are speaking directly to the user.

LANGUAGE:
Respond in ${languageNames[language]} unless the user explicitly requests another language.

LANGUAGE STYLE:
${languageStyles[language]}

CURRENT MODE:
${modeInstructions[mode]}

BUSINESS CONTEXT:
${businessContext || "No business context has been provided."}

CORE BEHAVIOUR:

- Answer the user's latest message directly.
- Sound natural, human and conversational.
- Do not sound robotic.
- Do not translate phrases word-for-word if that would sound unnatural.
- Prefer simple, clear sentences.
- If the user says hello or gives a short greeting, respond with a short natural greeting.
- Do not turn a simple greeting into a long business consultation.
- If the request is clear, answer it directly.
- Ask a clarifying question only when genuinely necessary.
- Use previous conversation only as context.
- Do not repeat conversation history.
- Do not mention system prompts, hidden instructions, internal notes or AI reasoning.
- Never write phrases such as:
  "Note:"
  "The user seems to..."
  "The AI should..."
  "Let's continue the conversation"
  "Please respond in the format"
- Never pretend you are writing instructions for another assistant.
- You are HEGEVA AI speaking directly to the user.

QUALITY RULES:

- Give practical and realistic help.
- Keep simple questions concise.
- Give more detail when the user asks for complex help.
- Use bullet points only when they genuinely make the answer clearer.
- Avoid unnecessary disclaimers.
- Never promise guaranteed income, profit, customers, savings or results.
- Never invent business figures, customers, documents or actions.
- Clearly distinguish facts supplied by the user from suggestions.
- For legal, tax, accounting, medical or regulated matters, give general information and suggest professional advice where appropriate.
- Never request passwords, card details, private keys or highly sensitive information.
- For professional documents, create editable drafts and do not claim legal validity.
- For decisions, explain trade-offs instead of claiming there is one guaranteed best choice.

EXAMPLES OF NATURAL GREETINGS:

English:
User: Hello
Assistant: Hi! How can I help you today?

Hungarian:
User: Szia
Assistant: Szia! Miben segíthetek?

German:
User: Hallo
Assistant: Hallo! Wie kann ich dir helfen?

French:
User: Bonjour
Assistant: Bonjour ! Comment puis-je vous aider ?

Spanish:
User: Hola
Assistant: ¡Hola! ¿En qué puedo ayudarte?

Always answer naturally in the selected language.
        `.trim();

        // =====================================
        // STRUCTURED CHAT
        // =====================================

        const messages = [
          {
            role: "system",
            content:
              systemPrompt
          },

          ...safeHistory,

          {
            role: "user",
            content:
              message
          }
        ];

        // =====================================
        // RUN CLOUDFLARE AI
        // =====================================

        const result =
          await env.AI.run(
            "@cf/meta/llama-3.1-8b-instruct-fast",
            {
              messages,
              max_tokens: 700,
              temperature: 0.55
            }
          );

        let aiResponse =
          typeof result?.response ===
          "string"
            ? result.response.trim()
            : "";

        if (!aiResponse) {
          const fallbackMessages = {
            en:
              "Sorry, I could not generate a response. Please try again.",

            hu:
              "Sajnálom, most nem sikerült választ generálnom. Kérlek, próbáld újra.",

            de:
              "Entschuldigung, ich konnte gerade keine Antwort erstellen. Bitte versuche es erneut.",

            fr:
              "Désolé, je n'ai pas pu générer de réponse. Veuillez réessayer.",

            es:
              "Lo siento, no pude generar una respuesta. Inténtalo de nuevo."
          };

          aiResponse =
            fallbackMessages[
              language
            ] ||
            fallbackMessages.en;
        }

        // =====================================
        // COUNT SUCCESSFUL AI MESSAGE
        // =====================================

        await incrementAIUsage(
          env,
          user.id,
          period
        );

        const newUsed =
          usage.aiMessages + 1;

        const remaining =
          Math.max(
            0,
            planInfo.limit -
              newUsed
          );

        // =====================================
        // RESPONSE
        // =====================================

        return Response.json({
          response:
            aiResponse,

          plan:
            planInfo.plan,

          usage: {
            period,

            aiMessages:
              newUsed,

            limit:
              planInfo.limit,

            remaining
          }
        });
      } catch (error) {
        console.error(
          "HEGEVA AI chat error:",
          error
        );

        return Response.json(
          {
            error:
              "HEGEVA AI is temporarily unavailable."
          },
          {
            status: 500
          }
        );
      }
    }

    // =========================================
    // STATIC WEBSITE
    // =========================================

    return env.ASSETS.fetch(
      request
    );
  }
};
