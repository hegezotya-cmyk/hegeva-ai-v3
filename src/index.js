set -e

echo "Restoring last working src/index.js..."
git show HEAD~1:src/index.js > src/index.js

python3 <<'PY'
from pathlib import Path

path = Path("src/index.js")
code = path.read_text(encoding="utf-8")

# ============================================================
# HEGEVA AI V35.3.4
# FRESH CONVERSATION CORE
# ============================================================

start_marker = "        const rawHistory ="
end_marker = """        // =========================================
        // HEGEVA AI V35.3.3 — CLEAN AI CORE"""

start = code.find(start_marker)
end = code.find(end_marker, start)

if start == -1 or end == -1:
    raise SystemExit(
        "ERROR: V35.3.3 history block not found. Nothing changed."
    )

replacement = """        // =========================================
        // HEGEVA AI V35.3.4 — FRESH CONVERSATION CORE
        // Old contaminated history is intentionally ignored.
        // =========================================

        const safeHistory = [];

"""

code = code[:start] + replacement + code[end:]


# ------------------------------------------------------------
# Remove old history injection from AI messages.
# Only SYSTEM + CURRENT USER MESSAGE will be sent.
# ------------------------------------------------------------

loop_start_marker = "        for (const item of safeHistory) {"

user_marker = """        messages.push({
          role: "user",
          content: message
        });"""

loop_start = code.find(loop_start_marker)
user_start = code.find(user_marker, loop_start)

if loop_start != -1 and user_start != -1:
    code = (
        code[:loop_start]
        + user_marker
        + code[user_start + len(user_marker):]
    )


# ------------------------------------------------------------
# Improve server-side cleanup.
# If the model writes "HEGEVA AI válasza:",
# keep the actual answer AFTER that label.
# ------------------------------------------------------------

needle = """        let aiResponse =
          typeof result?.response === "string"
            ? result.response.trim()
            : "";

        // Defensive cleanup for obvious model-control leakage."""

replacement_cleanup = """        let aiResponse =
          typeof result?.response === "string"
            ? result.response.trim()
            : "";

        // =========================================
        // V35.3.4 RESPONSE NORMALIZER
        // =========================================

        const answerLabel =
          /(?:^|\\\\n)\\\\s*HEGEVA AI\\\\s+(?:VÁLASZA|RESPONSE|ANSWER|ANTWORT|RÉPONSE|RESPUESTA)\\\\s*:\\\\s*/i.exec(
            aiResponse
          );

        if (answerLabel) {
          aiResponse =
            aiResponse
              .slice(
                answerLabel.index +
                answerLabel[0].length
              )
              .trim();
        }

        // Defensive cleanup for obvious model-control leakage."""

if needle not in code:
    raise SystemExit(
        "ERROR: AI response block not found. Nothing changed."
    )

code = code.replace(
    needle,
    replacement_cleanup,
    1
)


# ------------------------------------------------------------
# Update version
# ------------------------------------------------------------

code = code.replace(
    "HEGEVA AI V35.3.3 — CLEAN AI CORE",
    "HEGEVA AI V35.3.4 — FRESH CONVERSATION CORE"
)

code = code.replace(
    '"V35.3.3"',
    '"V35.3.4"'
)

path.write_text(
    code,
    encoding="utf-8"
)

print("")
print("✅ HEGEVA AI V35.3.4 INSTALLED")
print("✅ Broken Terminal text removed from src/index.js")
print("✅ Old AI history disabled")
print("✅ Only current user request sent to AI")
print("✅ HEGEVA AI response-label cleanup improved")
print("✅ Stripe untouched")
print("✅ Authentication untouched")
print("✅ D1 untouched")
print("✅ Workspace untouched")
print("")
PY

echo "Checking JavaScript..."
node --check src/index.js

echo ""
echo "✅ SUCCESS — src/index.js syntax is valid"
echo "✅ READY TO COMMIT"
