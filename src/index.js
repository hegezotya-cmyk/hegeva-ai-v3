export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // -----------------------------
    // HEGEVA AI CHAT API
    // -----------------------------
    if (url.pathname === "/api/chat") {
      if (request.method !== "POST") {
        return new Response(
          JSON.stringify({
            error: "Method not allowed"
          }),
          {
            status: 405,
            headers: {
              "Content-Type": "application/json"
            }
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
          return new Response(
            JSON.stringify({
              error: "Please enter a message."
            }),
            {
              status: 400,
              headers: {
                "Content-Type": "application/json"
              }
            }
          );
        }

        // Keep requests reasonably small.
        if (message.length > 4000) {
          return new Response(
            JSON.stringify({
              error: "Message is too long."
            }),
            {
              status: 400,
              headers: {
                "Content-Type": "application/json"
              }
            }
          );
        }

        const result = await env.AI.run(
          "@cf/meta/llama-3.1-8b-instruct",
          {
            prompt: `
You are Hegeva AI, a practical business assistant.

Help freelancers and small businesses with:
- organisation
- productivity
- business planning
- document wording
- explaining basic business concepts
- saving time on everyday admin

Rules:
- Do not promise guaranteed income, profit, growth or results.
- Do not invent business data.
- If the user asks for legal, tax or financial advice, explain that your response is general information and they may need a qualified professional.
- Keep answers clear, practical and friendly.
- Reply in the same language as the user whenever possible.

User message:
${message}
            `.trim()
          }
        );

        return new Response(
          JSON.stringify({
            response:
              result?.response ||
              "Hegeva AI could not generate a response."
          }),
          {
            headers: {
              "Content-Type": "application/json"
            }
          }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({
            error: "Hegeva AI is temporarily unavailable."
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json"
            }
          }
        );
      }
    }

    // -----------------------------
    // STATIC WEBSITE
    // -----------------------------
    if (url.pathname === "/") {
      return env.ASSETS.fetch(
        new Request(
          new URL("/index.html", request.url),
          request
        )
      );
    }

    return env.ASSETS.fetch(request);
  }
};
