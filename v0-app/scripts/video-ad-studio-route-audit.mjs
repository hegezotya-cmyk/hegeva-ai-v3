import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

const root = process.cwd()
const page = join(root, "app/app-studio/video-ad-studio/page.tsx")
const component = join(root, "components/app-studio/video-ad-studio.tsx")
if (!existsSync(page) || !existsSync(component)) throw new Error("Video Ad Studio route is missing")
const source = readFileSync(component, "utf8")
for (const token of ["useWorkspaceData", "video_ad_specs", "validateVideoBrief", "createVideoStoryboard", "setItems", "duplicate", "provider approval", "not a rendered video", "aria-live"]) {
  if (!source.toLowerCase().includes(token.toLowerCase())) throw new Error(`Video route contract missing: ${token}`)
}
for (const locale of ["en:", "hu:", "de:", "fr:", "es:"]) if (!source.includes(locale)) throw new Error(`Video locale missing: ${locale}`)
if (/fetch\s*\(/.test(source)) throw new Error("Video studio must not create an unapproved provider request")
console.log("Video Ad Studio route audit passed")
