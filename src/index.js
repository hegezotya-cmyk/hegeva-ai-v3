node <<'NODE'
const fs = require("fs");

const file = "src/index.js";

if (!fs.existsSync(file)) {
  console.error("ERROR: src/index.js not found.");
  process.exit(1);
}

let code = fs.readFileSync(file, "utf8");

/*
  V35.3.4
  Fresh Conversation Core

  Changes:
  - ignores all incoming chat history
  - sends only system + latest user message
  - strips HEGEVA AI response labels
  - keeps Stripe / Auth / D1 / Workspace untouched
*/

const historyStart = `        const rawHistory =`;
const historyEnd = `        // =========================================
        // HEGEVA AI V35.3.3 — CLEAN AI CORE`;

const hs = code.indexOf(historyStart);
const he = code.indexOf(historyEnd, hs);

if (hs === -1 || he === -1) {
  console.error("ERROR: history block not found. Nothing changed.");
  process.exit(1);
}

const freshHistoryBlock = `        // =========================================
        // HEGEVA AI V35.3.4 — FRESH CONVERSATION CORE
        // Ignore old/contaminated chat history.
        // =========================================

        const safeHistory = [];

`;

code =
  code.slice(0, hs) +
  freshHistoryBlock +
  code.slice(he);

/*
  Remove the old safeHistory injection into messages.
*/

const historyLoopStart = `        for (const item of safeHistory) {`;
const userPushMarker = `        messages.push({
          role: "user",
          content: message
        });`;

const ls = code.indexOf(historyLoopStart);
const up = code.indexOf(userPushMarker, ls);

if (ls !== -1 && up !== -1) {
  code =
    code.slice(0, ls) +
    userPushMarker +
    code.slice(up + userPushMarker.length);
}

/*
  Strengthen response label cleanup.
*/

const oldCleanup = `.replace(/^HEGEVA AI\\s+(?:VÁLASZA|RESPONSE|ANSWER|ANTWORT|RÉPONSE|RESPUESTA)\\s*:?\\s*/i, "")`;

const newCleanup = `.replace(/^(?:HEGEVA AI\\s*)?(?:VÁLASZA|RESPONSE|ANSWER|ANTWORT|RÉPONSE|RESPUESTA)\\s*:?\\s*/i, "")
            .replace(/^HEGEVA AI\\s+válasza\\s*:?\\s*/i, "")
            .replace(/^HEGEVA AI\\s+response\\s*:?\\s*/i, "")`;

if (code.includes(oldCleanup)) {
  code =
    code.replace(
      oldCleanup,
      newCleanup
    );
}

/*
  Update version string.
*/

code =
  code.replaceAll(
    "V35.3.3",
    "V35.3.4"
  );

fs.writeFileSync(
  file,
  code,
  "utf8"
);

console.log("");
console.log("✅ HEGEVA AI V35.3.4 FRESH CONVERSATION CORE INSTALLED");
console.log("✅ Old chat history disabled");
console.log("✅ Only latest user message is sent");
console.log("✅ Response labels cleaned");
console.log("✅ Stripe untouched");
console.log("✅ Authentication untouched");
console.log("✅ D1 untouched");
console.log("✅ Workspace untouched");
console.log("");
NODE

node --check src/index.js
