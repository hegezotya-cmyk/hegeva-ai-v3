export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/chat") {
      if (request.method !== "POST") {
        return Response.json(
          { error: "Method not allowed" },
          { status: 405 }
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
            { error: "Please enter a message." },
            { status: 400 }
          );
        }

        if (message.length > 4000) {
          return Response.json(
            { error: "Message is too long." },
            { status: 400 }
          );
        }

        const result = await env.AI.run(
          "@cf/meta/llama-3.1-8b-instruct-fast",
          {
            prompt: `
You are HEGEVA AI, a practical business assistant.

Help with:
- business organisation
- productivity
- planning
- document wording
- everyday business admin

Rules:
- Never promise guaranteed profit, income or growth.
- Never invent business data.
- For legal, tax or financial topics, give general information only.
- Be practical and clear.
- Reply in the same language as the user whenever possible.

User:
${message}
            `.trim()
          }
        );

        return Response.json({
          response:
            result?.response ||
            "HEGEVA AI could not generate a response."
        });

      } catch (error) {
        return Response.json(
          {
            error: "Hegeva AI is temporarily unavailable."
          },
          {
            status: 500
          }
        );
      }
    }

    return env.ASSETS.fetch(request);
  }
};
