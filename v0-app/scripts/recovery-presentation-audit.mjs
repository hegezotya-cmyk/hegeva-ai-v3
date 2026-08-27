import fs from "node:fs"

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8")
const requireText = (source, text, message) => {
  if (!source.includes(text)) throw new Error(message)
}
const rejectText = (source, text, message) => {
  if (source.includes(text)) throw new Error(message)
}

const renderer = read("components/x30/safe-renderer.tsx")
const schema = read("lib/x30/schema.ts")
const assistant = read("components/assistant/assistant-chat.tsx")
const header = read("components/site-header.tsx")
const hero = read("components/home/hero.tsx")
const studio = read("app/app-studio/page.tsx")
const command = read("components/command-center/workspace-overview.tsx")
const globalCss = read("app/globals.css")

for (const unsafe of ["dangerouslySetInnerHTML", "eval(", "new Function", "Function("]) {
  rejectText(renderer, unsafe, `X30 renderer contains unsafe execution surface: ${unsafe}`)
}
requireText(renderer, "validateX30Spec", "X30 UI must revalidate the hardened schema")
requireText(schema, "Duplicate id", "X30 schema must retain duplicate-ID protection")
requireText(assistant, 'fetch("/api/chat"', "current Assistant API behavior was not preserved")
requireText(assistant, "useSession", "current Assistant authentication boundary was not preserved")
requireText(header, "LanguageSwitcher", "language control must remain available")
requireText(header, "logout", "logout control must remain available")
requireText(header, "mobileOpen", "responsive mobile navigation must remain available")
requireText(hero, 'href: "/app-studio/x30-alpha"', "Home must expose the truthful X30 preview route")
for (const fake of ["w-[82%]", ">Online<", ">Synced<", "Live command surface"]) {
  rejectText(hero, fake, `Home retains fabricated status surface: ${fake}`)
}
for (const locale of ["en:", "hu:", "de:", "fr:", "es:"]) {
  requireText(hero, locale, `Home route directory is missing locale ${locale}`)
  requireText(studio, locale, `X30 App Studio entry is missing locale ${locale}`)
}
requireText(command, "createOperatingCenterSnapshot", "Command Center must consume the Operating Center read model")
requireText(command, "MetricCard", "Command Center semantic metrics must use the visual-engine metric surface")
requireText(globalCss, "prefers-reduced-motion: reduce", "visual system must respect reduced-motion preferences")
requireText(globalCss, ".x30-app", "X30 scoped presentation styles are missing")

console.log("Recovery presentation audit passed: safe X30 rendering, preserved Assistant/auth/navigation behavior, truthful Home and Command Center surfaces, five-locale recovery copy, and reduced-motion styling")
