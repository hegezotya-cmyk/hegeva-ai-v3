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

        if (message.length > 2500) {
          return Response.json(
            { error: "Message is too long." },
            { status: 400 }
          );
        }

        const allowedModes = new Set([
          "general",
          "time",
          "planner",
          "documents",
          "ideas"
        ]);

        const mode =
          allowedModes.has(body.mode)
            ? body.mode
            : "general";

        const modeInstruction =
          typeof body.modeInstruction === "string"
            ? body.modeInstruction.slice(0, 500)
            : "";

        const history =
          Array.isArray(body.history)
            ? body.history.slice(-10)
            : [];

        const transcript = history
          .filter(
            (item) =>
              item &&
              (item.role === "user" ||
                item.role === "assistant") &&
              typeof item.content === "string"
          )
          .map(
            (item) =>
              `${
                item.role === "assistant"
                  ? "HEGEVA AI"
                  : "User"
              }: ${item.content.slice(0, 1500)}`
          )
          .join("\n\n");

        const prompt = `
You are HEGEVA AI, a practical business companion.

Purpose:
- Organise business work.
- Reduce unnecessary admin.
- Improve productivity.
- Plan practical next steps.
- Help with business wording and documents.
- Explain general business concepts.
- Act as a business idea partner.

Current mode: ${mode}
Mode instruction: ${modeInstruction}

Rules:
- Never promise guaranteed income, profit, growth, customers or results.
- Never invent the user's business data.
- Never claim work was completed unless the user confirms it.
- For legal, tax or financial topics, give general information only and say when a qualified professional may be needed.
- Do not request passwords, card details, private keys or highly sensitive information.
- Keep advice practical and clear.
- Reply in the same language as the user's latest message whenever possible.

Recent conversation:
${transcript || "(no previous messages)"}

Latest user message:
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

    return env.ASSETS.fetch(request);
  }
};
