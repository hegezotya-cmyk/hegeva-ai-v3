import { betterAuth } from "better-auth";

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

    user: {
      modelName: "user"
    },

    session: {
      modelName: "session"
    },

    account: {
      modelName: "account"
    },

    verification: {
      modelName: "verification"
    }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // =========================================
    // HEGEVA AI V4.5 AUTH
    // =========================================

    if (url.pathname.startsWith("/api/auth/")) {
      try {
        const auth = createAuth(env, request);
        return await auth.handler(request);
      } catch (error) {
        console.error("HEGEVA Auth error:", error);

        return Response.json(
          {
            error: "Authentication service temporarily unavailable."
          },
          {
            status: 500
          }
        );
      }
    }

    // =========================================
    // HEGEVA AI CHAT
    // =========================================

    if (url.pathname === "/api/chat") {
      if (request.method !== "POST") {
        return Response.json(
          {
            error: "Method not allowed"
          },
          {
            status: 405
          }
        );
      }

      try {
        const body = await request.json();

        const message =
          typeof body.message === "string"
            ? body.message.trim()
            : "";

        if (!message) {
          return Response.json(
            {
              error: "Please enter a message."
            },
            {
              status: 400
            }
          );
        }

        if (message.length > 2500) {
          return Response.json(
            {
              error: "Message is too long."
            },
            {
              status: 400
            }
          );
        }

        const modeInstructions = {
          general:
            "Give practical general business help.",

          time:
            "Focus on repetitive work, admin bottlenecks and realistic ways to save time.",

          planner:
            "Help prioritise tasks and create a realistic action plan.",

          documents:
            "Help with professional wording, emails and document structure. Do not claim legal validity.",

          ideas:
            "Act as an idea partner. Give options, trade-offs and questions to test without promising results.",

          decision:
            "Compare options neutrally with benefits, drawbacks, risks, assumptions and questions to verify.",

          meeting:
            "Turn meeting information into a concise summary, decisions, open questions and action items.",

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
          typeof body.businessContext === "string"
            ? body.businessContext
                .slice(0, 500)
                .trim()
            : "";

        const rawHistory =
          Array.isArray(body.history)
            ? body.history.slice(-10)
            : [];

        let totalChars = 0;
        const safeHistory = [];

        for (const item of rawHistory) {
          if (
            !item ||
            !["user", "assistant"].includes(item.role) ||
            typeof item.content !== "string"
          ) {
            continue;
          }

          const content =
            item.content.slice(0, 1200);

          if (totalChars + content.length > 7000) {
            break;
          }

          totalChars += content.length;

          safeHistory.push({
            role: item.role,
            content
          });
        }

        const transcript =
          safeHistory
            .map(
              (item) =>
                `${
                  item.role === "assistant"
                    ? "HEGEVA AI"
                    : "User"
                }: ${item.content}`
            )
            .join("\n\n");

        const prompt = `
You are HEGEVA AI, a practical business companion.

Primary goal:
Help users save time, organise work, think clearly and create useful business drafts.

Selected mode:
${modeInstructions[mode]}

Required response language:
${languageNames[language]}.

Always answer in this language unless the user explicitly asks for another language.

Optional business context:
${businessContext || "(none provided)"}

Rules:

- Never promise guaranteed income, profit, growth, customers, savings or results.

- Never invent the user's business figures, customers, documents or completed actions.

- Separate facts supplied by the user from suggestions or assumptions.

- For legal, tax, accounting, medical or regulated matters, provide general information only and say when professional advice may be appropriate.

- Do not request passwords, card details, private keys or highly sensitive information.

- For customer messages and document wording, produce editable drafts and do not claim legal validity.

- For decisions, explain trade-offs instead of telling the user there is a guaranteed best choice.

- Keep answers practical, clear and reasonably concise.

Recent conversation:

${transcript || "(no recent messages)"}

Latest message:

${message}
        `.trim();

        const result = await env.AI.run(
          "@cf/meta/llama-3.1-8b-instruct-fast",
          {
            prompt
          }
        );

        return Response.json({
          response:
            result?.response ||
            "HEGEVA AI could not generate a response."
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
    // STATIC HEGEVA WEBSITE
    // =========================================

    return env.ASSETS.fetch(request);
  }
};
