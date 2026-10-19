import fs from "node:fs"

const expected = {
  li: "linkedin",
  fb: "facebook",
  ig: "instagram",
  tt: "tiktok",
  reddit: "reddit",
  yt: "youtube",
  sc: "snapchat",
}

for (const [route, source] of Object.entries(expected)) {
  const path = new URL(`../app/${route}/page.tsx`, import.meta.url)
  const content = fs.readFileSync(path, "utf8")
  const target = `/?utm_source=${source}&utm_medium=organic&utm_campaign=hegeva_growth_2026`
  if (!content.includes('redirect("'+target+'")')) throw new Error(`Short link /${route} target mismatch`)
  if (/fetch\(|window\.|localStorage|sessionStorage/.test(content)) throw new Error(`Short link /${route} must stay server-only`)
}
console.log("HEGEVA marketing short-links audit PASS")
