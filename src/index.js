import { createAuth, getLoggedInUser } from "./auth.js";

const AI_MODEL = "@cf/meta/llama-3.1-8b-instruct";

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  });
}

function cleanResponseText(value = "") {
  let output = String(value || "");

  output = output
    .replace(/^\s*(?:HEGEVA AI\s*)?(?:VÁLASZA|RESPONSE|ANSWER|ANTWORT|RÉPONSE|RESPUESTA)\s*:?\s*/i, "")
    .replace(/^\s*HEGEVA AI\s+válasza\s*:?\s*/i, "")
    .replace(/^\s*HEGEVA AI\s+response\s*:?\s*/i, "")
    .replace(/^\s*HEGEVA AI[\s:-]+/i, "")
    .replace(/\r\n/g, "\n")
    .trim();

  return output;
}

function buildChatMessages({ message, businessContext, language, mode }) {
  const contextBlock = String(businessContext || "").trim();

  const userContent = [
    `Language: ${String(language || "en").trim() || "en"}`,
    `Mode: ${String(mode || "general").trim() || "general"}`,
    contextBlock ? `Business context:\n${contextBlock}` : "",
    `User message:\n${String(message || "").trim()}`
  ]
    .filter(Boolean)
    .join("\n\n");

  return [
    {
      role: "system",
      content:
        "You are HEGEVA AI, a practical business assistant. Keep replies concise, clear, and business-appropriate. Do not add labels such as 'HEGEVA AI RESPONSE' or 'HEGEVA AI VÁLASZA'. If the user asks for a language, follow it."
    },
    {
      role: "user",
      content: userContent
    }
  ];
}

async function runHegevaAi(env, messages) {
  if (!env?.AI) {
    throw new Error("AI binding is not configured.");
  }

  const aiResult = await env.AI.run(AI_MODEL, {
    messages,
    max_tokens: 700,
    temperature: 0.7
  });

  const text =
    aiResult?.response ||
    aiResult?.result ||
    aiResult?.answer ||
    aiResult?.output ||
    aiResult?.message ||
    aiResult?.choices?.[0]?.message?.content ||
    "";

  return cleanResponseText(text) || "I could not generate a clear response. Please try again.";
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/auth") || url.pathname.startsWith("/auth")) {
      const auth = createAuth(env, request, ctx);
      return auth.handler(request);
    }

    if (url.pathname === "/api/user") {
      const user = await getLoggedInUser(request, env, ctx);
      return jsonResponse({ user: user ? { id: user.id, email: user.email, name: user.name } : null });
    }

    if (url.pathname === "/api/chat") {
      if (request.method !== "POST") {
        return jsonResponse({ error: "Method not allowed." }, 405);
      }

      try {
        const body = await request.json().catch(() => ({}));
        const message = String(body?.message || "").trim();

        if (!message) {
          return jsonResponse({ error: "Missing message." }, 400);
        }

        const safeHistory = [];
        const messages = buildChatMessages({
          message,
          businessContext: body?.businessContext || "",
          language: body?.language || "en",
          mode: body?.mode || "general"
        });

        if (Array.isArray(body?.history) && body.history.length > 0) {
          safeHistory.push(...body.history.slice(-1));
        }

        const responseText = await runHegevaAi(env, messages);

        return jsonResponse({
          response: responseText,
          history: safeHistory,
          status: "ok"
        });
      } catch (error) {
        console.error("HEGEVA chat error:", error);
        return jsonResponse(
          {
            error: error?.message || "AI request failed.",
            response: "AI request failed. Please try again."
          },
          500
        );
      }
    }

    if (url.pathname.startsWith("/api/")) {
      return jsonResponse({ error: "Not found." }, 404);
    }

    if (env?.ASSETS?.fetch) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not found", { status: 404 });
  }
};


