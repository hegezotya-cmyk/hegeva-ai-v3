import fs from "node:fs"
import assert from "node:assert/strict"

const header = fs.readFileSync(new URL("../components/site-header.tsx", import.meta.url), "utf8")
const language = fs.readFileSync(new URL("../components/language-switcher.tsx", import.meta.url), "utf8")
const assistant = fs.readFileSync(new URL("../components/assistant/assistant-chat.tsx", import.meta.url), "utf8")
const workspace = fs.readFileSync(new URL("../components/business/local-workspace.tsx", import.meta.url), "utf8")
const button = fs.readFileSync(new URL("../components/ui/button.tsx", import.meta.url), "utf8")
const globalCss = fs.readFileSync(new URL("../app/globals.css", import.meta.url), "utf8")

assert(/max-h-\[calc\(100dvh-4rem\)\]/.test(header), "Mobile navigation must remain within the dynamic viewport")
assert(/overflow-y-auto/.test(header) && /overscroll-contain/.test(header), "Long mobile navigation must scroll without leaking overscroll")
assert(/safe-area-inset-bottom/.test(header), "Mobile navigation must respect the device safe area")
assert(/grid-cols-2/.test(header) && /col-span-2/.test(header), "Mobile account controls must not squeeze three controls into one row")
assert(/size-11/.test(header), "Mobile menu control must have a 44px touch target")
assert(/min-h-11/.test(language), "Language controls must have 44px touch targets")
assert(/flex-col gap-3 sm:flex-row/.test(assistant), "Assistant composer must stack on narrow screens")
assert(/w-full.*sm:w-auto/.test(assistant), "Assistant send action must remain reachable on narrow screens")
assert(/flex-col.*sm:flex-row/.test(workspace), "Business record cards must stack actions on narrow screens")
assert(/min-h-11 min-w-11/.test(workspace), "Business record actions must have 44px touch targets")
assert(/lg: 'h-11/.test(button), "Large shared buttons must have 44px touch targets")
assert(/overflow-x: hidden/.test(globalCss) && /min-width: 320px/.test(globalCss), "The app shell must guard against viewport overflow")
assert(/touch-action: manipulation/.test(globalCss), "Interactive controls must use responsive touch behavior")

console.log("UI/mobile audit passed: viewport-safe navigation, mobile composer, responsive records, touch targets, safe areas, and overflow guards")
