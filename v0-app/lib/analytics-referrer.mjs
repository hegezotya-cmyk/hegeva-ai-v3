export function analyticsReferrerOrigin(referrer, currentOrigin) {
  try {
    const source = new URL(referrer)
    const current = new URL(currentOrigin)
    if (!["http:", "https:"].includes(source.protocol) || !["http:", "https:"].includes(current.protocol)) return ""
    if (source.origin === current.origin) return ""
    return `${source.origin}/`
  } catch {
    return ""
  }
}
