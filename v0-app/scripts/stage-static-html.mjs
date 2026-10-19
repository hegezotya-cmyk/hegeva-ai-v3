import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const appRoot = fileURLToPath(new URL("..", import.meta.url))
const sourceRoot = path.join(appRoot, ".next", "server", "app")
const assetRoot = path.join(appRoot, ".open-next", "assets")

function copyHtml(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const source = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      copyHtml(source)
      continue
    }
    if (!entry.name.endsWith(".html")) continue
    const relative = path.relative(sourceRoot, source)
    const target = path.join(assetRoot, relative)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.copyFileSync(source, target)
  }
}

copyHtml(sourceRoot)
console.log("Static HTML staged for Cloudflare asset-first delivery")
