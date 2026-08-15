import {
  createAuth,
  getLoggedInUser,
  sendResendEmail,
  HEGEVA_EMAIL_FROM
} from "./auth.js";

// =========================================
// HEGEVA AI V34.9
// ACCOUNT + PASSWORD RECOVERY BACKEND
// =========================================

const PLAN_LIMITS = {
  basic: 50,
  premium: 300,
  pro: 1000
};

function validWorkspaceType(type) {
  return /^[a-z0-9_-]{1,40}$/i.test(type);
}

function getCurrentPeriod() {
  const now = new Date();

  const year =
    now.getUTCFullYear();

  const month =
    String(
      now.getUTCMonth() + 1
    ).padStart(2, "0");

  return `${year}-${month}`;
}

async function ensureUserPlan(
  env,
  userId
) {
  const now =
    new Date().toISOString();

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

async function getUserPlan(
  env,
  userId
) {
  await ensureUserPlan(
    env,
    userId
  );

  const row =
    await env.DB
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
    Object.prototype
      .hasOwnProperty.call(
        PLAN_LIMITS,
        row.plan
      )
      ? row.plan
      : "basic";

  return {
    plan,
    limit:
      PLAN_LIMITS[plan],
    createdAt:
      row?.createdAt || null,
    updatedAt:
      row?.updatedAt || null
  };
}

async function getAIUsage(
  env,
  userId,
  period
) {
  const row =
    await env.DB
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
        Number(
          row?.aiMessages
        )
      )
        ? Number(
            row.aiMessages
          )
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
  const now =
    new Date().toISOString();

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
          aiMessages + 1,
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

function getPublicAppUrl(
  request,
  env
) {
  const configured =
    typeof env.PUBLIC_APP_URL === "string"
      ? env.PUBLIC_APP_URL.trim()
      : "";

  if (configured) {
    try {
      const parsed =
        new URL(configured);

      if (
        parsed.protocol === "https:"
      ) {
        return parsed.origin;
      }
    } catch {}
  }

  return new URL(
    request.url
  ).origin;
}

function getStripePriceId(
  env,
  plan
) {
  if (plan === "premium") {
    return typeof env.STRIPE_PREMIUM_PRICE_ID === "string"
      ? env.STRIPE_PREMIUM_PRICE_ID.trim()
      : "";
  }

  if (plan === "pro") {
    return typeof env.STRIPE_PRO_PRICE_ID === "string"
      ? env.STRIPE_PRO_PRICE_ID.trim()
      : "";
  }

  return "";
}

function isStripeTestSecret(
  value
) {
  return (
    typeof value === "string" &&
    value.startsWith("sk_test_")
  );
}

async function createStripeCheckoutSession(
  request,
  env,
  user,
  plan
) {
  const secretKey =
    typeof env.STRIPE_SECRET_KEY === "string"
      ? env.STRIPE_SECRET_KEY.trim()
      : "";

  if (
    !isStripeTestSecret(
      secretKey
    )
  ) {
    return {
      ok: false,
      status: 503,
      error:
        "Stripe test secret is not configured."
    };
  }

  const priceId =
    getStripePriceId(
      env,
      plan
    );

  if (!priceId) {
    return {
      ok: false,
      status: 503,
      error:
        "Stripe test price is not configured for this plan."
    };
  }

  const appUrl =
    getPublicAppUrl(
      request,
      env
    );

  const form =
    new URLSearchParams();

  form.set(
    "mode",
    "subscription"
  );

  // V34.9:
  // Managed Payments is disabled for this Stripe Sandbox
  // Checkout session because HEGEVA uses the standard
  // Stripe Checkout integration in this test flow.
  form.set(
    "managed_payments[enabled]",
    "false"
  );

  form.set(
    "line_items[0][price]",
    priceId
  );

  form.set(
    "line_items[0][quantity]",
    "1"
  );

  form.set(
    "client_reference_id",
    String(
      user.id
    )
  );

  if (user.email) {
    form.set(
      "customer_email",
      user.email
    );
  }

  form.set(
    "success_url",
    `${appUrl}/?billing=success&session_id={CHECKOUT_SESSION_ID}`
  );

  form.set(
    "cancel_url",
    `${appUrl}/?billing=cancelled`
  );

  form.set(
    "metadata[userId]",
    String(
      user.id
    )
  );

  form.set(
    "metadata[hegevaPlan]",
    plan
  );

  const response =
    await fetch(
      "https://api.stripe.com/v1/checkout/sessions",
      {
        method:
          "POST",

        headers: {
          Authorization:
            `Bearer ${secretKey}`,

          "Content-Type":
            "application/x-www-form-urlencoded"
        },

        body:
          form.toString()
      }
    );

  let data = null;

  try {
    data =
      await response.json();
  } catch {}

  if (!response.ok) {
    console.error(
      "HEGEVA Stripe checkout error:",
      data
    );

    return {
      ok: false,

      status:
        response.status ||
        502,

      error:
        data?.error?.message ||
        "Stripe test checkout could not be created."
    };
  }

  if (
    !data?.id ||
    !data?.url
  ) {
    return {
      ok: false,

      status: 502,

      error:
        "Stripe returned an incomplete checkout session."
    };
  }

  return {
    ok: true,
    status: 200,
    id: data.id,
    url: data.url
  };
}

export default {
  async fetch(
    request,
    env,
    ctx
  ) {
    const url =
      new URL(
        request.url
      );

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
            request,
            ctx
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
    // EMAIL STATUS
    // =========================================

    if (
      url.pathname ===
      "/api/system/email-status"
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

      return Response.json({
        configured:
          Boolean(
            env.RESEND_API_KEY
          ),

        provider:
          env.RESEND_API_KEY
            ? "Resend"
            : "Not configured",

        sender:
          HEGEVA_EMAIL_FROM,

        passwordRecovery:
          Boolean(
            env.RESEND_API_KEY
          ),

        resetLinkExpiresInSeconds:
          3600,

        revokeSessionsOnPasswordReset:
          true
      });
    }

    // =========================================
    // SECURITY EMAIL TEST
    // =========================================

    if (
      url.pathname ===
      "/api/email/test"
    ) {
      if (
        request.method !==
        "POST"
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
            env,
            ctx
          );

        if (!user?.email) {
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

        const result =
          await sendResendEmail(
            env,
            {
              to:
                user.email,

              subject:
                "HEGEVA AI security email test",

              text:
                "Your HEGEVA AI email connection is working. No action is required.",

              html:
                `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#172033"><h2>HEGEVA AI security test</h2><p>Your HEGEVA AI email connection is working.</p><p>No action is required.</p></div>`,

              idempotencyKey:
                `hegeva-security-test-${crypto.randomUUID()}`
            }
          );

        return Response.json({
          ok: true,

          to:
            user.email,

          id:
            result?.id ||
            null
        });
      } catch (error) {
        console.error(
          "HEGEVA security test email error:",
          error
        );

        return Response.json(
          {
            error:
              "Security test email could not be sent."
          },
          {
            status: 502
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
            env,
            ctx
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

        const planInfo =
          await getUserPlan(
            env,
            user.id
          );

        const period =
          getCurrentPeriod();

        const usage =
          await getAIUsage(
            env,
            user.id,
            period
          );

        return Response.json({
          plan:
            planInfo.plan,

          aiMessages:
            usage.aiMessages,

          aiLimit:
            planInfo.limit,

          period
        });
      } catch (error) {
        console.error(
          "HEGEVA plan error:",
          error
        );

        return Response.json(
          {
            error:
              "Plan service temporarily unavailable."
          },
          {
            status: 500
          }
        );
      }
    }

    // =========================================
    // HEGEVA AI V34.9
    // STRIPE TEST CHECKOUT BACKEND
    // =========================================

    if (
      url.pathname ===
      "/api/billing/status"
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
            env,
            ctx
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

        const provider =
          typeof env.PAYMENT_PROVIDER ===
            "string"
            ? env.PAYMENT_PROVIDER
                .trim()
                .toLowerCase()
            : "";

        const paymentMode =
          typeof env.PAYMENT_MODE ===
            "string"
            ? env.PAYMENT_MODE
                .trim()
                .toLowerCase()
            : "";

        const providerSelected =
          provider === "stripe";

        const testMode =
          paymentMode === "test";

        const secretReady =
          isStripeTestSecret(
            typeof env.STRIPE_SECRET_KEY === "string"
              ? env.STRIPE_SECRET_KEY.trim()
              : ""
          );

        const premiumPriceReady =
          Boolean(
            getStripePriceId(
              env,
              "premium"
            )
          );

        const proPriceReady =
          Boolean(
            getStripePriceId(
              env,
              "pro"
            )
          );

        const connected =
          providerSelected &&
          testMode &&
          secretReady;

        const checkoutEnabled =
          connected &&
          premiumPriceReady &&
          proPriceReady;

        return Response.json({
          available:
            true,

          connected,

          provider:
            providerSelected
              ? "Stripe"
              : null,

          mode:
            "test",

          checkoutEnabled,

          webhookVerified:
            false,

          entitlementSource:
            "backend",

          cardDataHandledByHegeva:
            false,

          paymentSecretsExposedToBrowser:
            false,

          managedPaymentsEnabled:
            false,

          testConfiguration: {
            providerSelected,
            testMode,
            secretReady,
            premiumPriceReady,
            proPriceReady
          },

          message:
            checkoutEnabled
              ? "Stripe test checkout is configured. Managed Payments is disabled for the HEGEVA Sandbox checkout. Entitlement remains unchanged until a verified webhook flow is implemented."
              : "Billing API is available, but Stripe test checkout setup is incomplete."
        });
      } catch (error) {
        console.error(
          "HEGEVA billing status error:",
          error
        );

        return Response.json(
          {
            error:
              "Billing status is temporarily unavailable."
          },
          {
            status: 500
          }
        );
      }
    }

    if (
      url.pathname ===
      "/api/billing/checkout"
    ) {
      if (
        request.method !==
        "POST"
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
            env,
            ctx
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

        const requestedPlan =
          typeof body?.plan ===
            "string"
            ? body.plan
                .trim()
                .toLowerCase()
            : "";

        if (
          ![
            "premium",
            "pro"
          ].includes(
            requestedPlan
          )
        ) {
          return Response.json(
            {
              error:
                "Invalid paid plan."
            },
            {
              status: 400
            }
          );
        }

        if (
          body?.mode !==
          "test"
        ) {
          return Response.json(
            {
              error:
                "Only test checkout is allowed in this build."
            },
            {
              status: 400
            }
          );
        }

        const provider =
          typeof env.PAYMENT_PROVIDER ===
            "string"
            ? env.PAYMENT_PROVIDER
                .trim()
                .toLowerCase()
            : "";

        const paymentMode =
          typeof env.PAYMENT_MODE ===
            "string"
            ? env.PAYMENT_MODE
                .trim()
                .toLowerCase()
            : "";

        if (
          provider !== "stripe" ||
          paymentMode !== "test"
        ) {
          return Response.json(
            {
              ok:
                false,

              provider:
                null,

              mode:
                "test",

              plan:
                requestedPlan,

              checkoutReady:
                false,

              entitlementChanged:
                false,

              cardDataHandledByHegeva:
                false,

              message:
                "Stripe test mode is not configured."
            },
            {
              status: 503
            }
          );
        }

        const checkout =
          await createStripeCheckoutSession(
            request,
            env,
            user,
            requestedPlan
          );

        if (!checkout.ok) {
          return Response.json(
            {
              ok:
                false,

              provider:
                "Stripe",

              mode:
                "test",

              plan:
                requestedPlan,

              checkoutReady:
                false,

              entitlementChanged:
                false,

              cardDataHandledByHegeva:
                false,

              error:
                checkout.error
            },
            {
              status:
                checkout.status
            }
          );
        }

        return Response.json({
          ok:
            true,

          provider:
            "Stripe",

          mode:
            "test",

          plan:
            requestedPlan,

          checkoutReady:
            true,

          id:
            checkout.id,

          sessionId:
            checkout.id,

          url:
            checkout.url,

          managedPaymentsEnabled:
            false,

          entitlementChanged:
            false,

          cardDataHandledByHegeva:
            false,

          message:
            "Stripe test checkout session created. Managed Payments is disabled. No HEGEVA entitlement has been changed."
        });
      } catch (error) {
        console.error(
          "HEGEVA billing checkout error:",
          error
        );

        return Response.json(
          {
            error:
              "Billing checkout is temporarily unavailable."
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
            env,
            ctx
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
              "/api/workspace/"
                .length
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

        // LOAD

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
              found:
                false,

              dataType,

              data:
                null
            });
          }

          let parsedData =
            null;

          try {
            parsedData =
              JSON.parse(
                row.data
              );
          } catch {}

          return Response.json({
            found:
              true,

            id:
              row.id,

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

        // SAVE

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
            !Object.prototype
              .hasOwnProperty.call(
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
            ok:
              true,

            dataType,

            updatedAt:
              now
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
    // HEGEVA AI CHAT
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
        const user =
          await getLoggedInUser(
            request,
            env,
            ctx
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

        const planInfo =
          await getUserPlan(
            env,
            user.id
          );

        const period =
          getCurrentPeriod();

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

              plan:
                planInfo.plan,

              limit:
                planInfo.limit,

              used:
                usage.aiMessages
            },
            {
              status: 429
            }
          );
        }

        const body =
          await request.json();

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
          en:
            "English",

          hu:
            "Hungarian",

          de:
            "German",

          fr:
            "French",

          es:
            "Spanish"
        };

        const mode =
          Object.prototype
            .hasOwnProperty.call(
              modeInstructions,
              body.mode
            )
            ? body.mode
            : "general";

        const language =
          Object.prototype
            .hasOwnProperty.call(
              languageNames,
              body.language
            )
            ? body.language
            : "en";

        const businessContext =
          typeof body.businessContext ===
            "string"
            ? body.businessContext
                .slice(
                  0,
                  500
                )
                .trim()
            : "";

        const rawHistory =
          Array.isArray(
            body.history
          )
            ? body.history
                .slice(-10)
            : [];

        let totalChars =
          0;

        const safeHistory =
          [];

        for (
          const item
          of rawHistory
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
            item.content.slice(
              0,
              1200
            );

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
            role:
              item.role,

            content
          });
        }

        const transcript =
          safeHistory
            .map(
              (item) =>
                `${
                  item.role ===
                  "assistant"
                    ? "HEGEVA AI"
                    : "User"
                }: ${item.content}`
            )
            .join(
              "\n\n"
            );

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
- For decisions, explain trade-offs instead of claiming there is a guaranteed best choice.
- Keep answers practical, clear and reasonably concise.

Recent conversation:
${transcript || "(no recent messages)"}

Latest message:
${message}
        `.trim();

        const result =
          await env.AI.run(
            "@cf/meta/llama-3.1-8b-instruct-fast",
            {
              prompt
            }
          );

        await incrementAIUsage(
          env,
          user.id,
          period
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

    return env.ASSETS.fetch(
      request
    );
  }
};
