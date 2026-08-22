import { betterAuth } from "better-auth";

export const HEGEVA_EMAIL_FROM =
  "HEGEVA AI <noreply@hegevaai.co.uk>";

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendResendEmail(
  env,
  { to, subject, html, text, idempotencyKey }
) {
  if (!env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  const response = await fetch(
    "https://api.resend.com/emails",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "User-Agent": "HEGEVA-AI/30.1",
        ...(idempotencyKey
          ? {
              "Idempotency-Key": idempotencyKey
            }
          : {})
      },
      body: JSON.stringify({
        from: HEGEVA_EMAIL_FROM,
        to: [to],
        subject,
        html,
        text
      })
    }
  );

  const data = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    console.error(
      "HEGEVA Resend error:",
      response.status,
      data
    );

    throw new Error(
      data?.message ||
        `Email provider returned HTTP ${response.status}.`
    );
  }

  return data;
}

function queueEmail(ctx, promise) {
  if (ctx?.waitUntil) {
    ctx.waitUntil(
      promise.catch((error) =>
        console.error(
          "HEGEVA queued email error:",
          error
        )
      )
    );
  } else {
    void promise.catch((error) =>
      console.error(
        "HEGEVA email error:",
        error
      )
    );
  }
}

export function createAuth(env, request, ctx) {
  const requestUrl =
    new URL(request.url);

  const origin =
    requestUrl.origin;

  const isHegevaDomain =
    requestUrl.hostname === "hegevaai.co.uk" ||
    requestUrl.hostname.endsWith(".hegevaai.co.uk");

  const publicAppUrl =
    isHegevaDomain
      ? "https://hegevaai.co.uk"
      : origin;

  return betterAuth({
    database: env.DB,

    secret:
      env.BETTER_AUTH_SECRET,

    baseURL:
      publicAppUrl,

    trustedOrigins: [
      "https://hegevaai.co.uk",
      "https://www.hegevaai.co.uk",
      origin
    ],

    advanced: {
      useSecureCookies:
        isHegevaDomain,

      crossSubDomainCookies: {
        enabled:
          isHegevaDomain,

        domain:
          "hegevaai.co.uk"
      }
    },

    emailAndPassword: {
      enabled: true,

      minPasswordLength: 8,

      maxPasswordLength: 128,

      autoSignIn: true,

      resetPasswordTokenExpiresIn:
        3600,

      revokeSessionsOnPasswordReset:
        true,

      sendResetPassword:
        async ({ user, url }) => {
          const safeName =
            escapeHtml(
              user?.name ||
                "there"
            );

          const safeUrl =
            escapeHtml(url);

          const emailPromise =
            sendResendEmail(
              env,
              {
                to:
                  user.email,

                subject:
                  "Reset your HEGEVA AI password",

                text:
`Hello ${user?.name || "there"},

Use this secure link to reset your HEGEVA AI password:
${url}

This link expires after one hour. If you did not request this, you can ignore this email.`,

                html:
`<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#172033">
  <h2>HEGEVA AI password reset</h2>

  <p>Hello ${safeName},</p>

  <p>
    A password reset was requested for your HEGEVA AI account.
  </p>

  <p>
    <a
      href="${safeUrl}"
      style="display:inline-block;padding:12px 18px;background:#111827;color:#fff;text-decoration:none;border-radius:8px"
    >
      Reset my password
    </a>
  </p>

  <p style="font-size:13px;color:#5f6b7a">
    This link expires after one hour.
    If you did not request a reset,
    ignore this email.
  </p>
</div>`,

                idempotencyKey:
                  `hegeva-reset-${crypto.randomUUID()}`
              }
            );

          queueEmail(
            ctx,
            emailPromise
          );
        }
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

export async function getLoggedInUser(
  request,
  env,
  ctx
) {
  const auth =
    createAuth(
      env,
      request,
      ctx
    );

  const session =
    await auth.api.getSession({
      headers:
        request.headers
    });

  return session?.user || null;
}
