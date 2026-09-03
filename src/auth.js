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
    console.error("HEGEVA_PROVIDER_FAILURE", {
      provider: "resend",
      operation: "email",
      reason: "provider_rejected",
      status: response.status,
      responseType: typeof data,
    });

    throw new Error("Email provider unavailable.");
  }

  return data;
}

export function createAuth(env, request, ctx) {
  const publicAppUrl =
    typeof env.PUBLIC_APP_URL === "string" &&
    env.PUBLIC_APP_URL.startsWith("https://")
      ? env.PUBLIC_APP_URL.replace(/\/$/, "")
      : "https://hegevaai.co.uk";

  return betterAuth({
    database: env.DB,

    secret:
      env.BETTER_AUTH_SECRET,

    baseURL:
      publicAppUrl,

    trustedOrigins: [
      publicAppUrl,
      "https://www.hegevaai.co.uk"
    ],

    advanced: {
      // Authentication is exposed through the same-origin Next.js proxy at
      // hegevaai.co.uk/api/auth. A host-only secure cookie is both safer and
      // more reliable than a Domain cookie here (especially after redirects).
      useSecureCookies: true
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

          // Password reset is a user-facing delivery action. Await the
          // provider here so Better Auth can report a real failure instead of
          // telling the UI an email was sent when Resend is missing or rejects
          // the request.
          await sendResendEmail(
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
