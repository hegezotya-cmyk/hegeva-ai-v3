import { betterAuth } from "better-auth";

export function createAuth(env) {
  return betterAuth({
    database: env.DB,

    secret: env.BETTER_AUTH_SECRET,

    emailAndPassword: {
      enabled: true
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
