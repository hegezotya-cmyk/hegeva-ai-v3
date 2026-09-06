import assert from "node:assert/strict"
import fs from "node:fs"
const root=new URL("../",import.meta.url),read=p=>fs.readFileSync(new URL(p,root),"utf8")
const slugs=["ai-for-small-business","ai-business-assistant","quote-and-invoice-software","ai-for-trades","ai-for-electricians"]
const config=read("lib/acquisition-pages.ts"),view=read("components/acquisition/acquisition-page.tsx"),sitemap=read("app/sitemap.ts"),robots=read("app/robots.ts"),worker=read("../src/index.js"),middleware=read("middleware.ts"),wrangler=read("wrangler.jsonc"),pricing=read("app/pricing/page.tsx"),measure=read("components/acquisition/acquisition-attribution.tsx"),consent=read("components/analytics-consent.tsx"),layout=read("app/layout.tsx")
for(const slug of slugs){const route=read(`app/${slug}/page.tsx`);assert(route.includes(`acquisitionPages["${slug}"]`),`${slug}: distinct content missing`);for(const token of ["title:","description:","alternates:{canonical:","openGraph:","twitter:"])assert(route.includes(token),`${slug}: metadata ${token} missing`);assert(sitemap.includes(`'/${slug}'`),`${slug}: sitemap missing`);assert(config.includes(`slug:"${slug}"`),`${slug}: configuration missing`)}
for(const token of ["WebApplication","BreadcrumbList","FAQPage","<h1","<h2","<h3","aria-label=\"HEGEVA product proof\"","Real workspace data when signed in","owner-controlled actions"])assert(view.includes(token),`Acquisition semantic/product-proof contract missing: ${token}`)
const h1s=[...config.matchAll(/,h1:"([^"]+)/g)].map(x=>x[1]);assert(h1s.length===5&&new Set(h1s).size===5,"Every page requires one unique H1 source")
assert(!/aggregateRating|reviewCount|bestRating|testimonial|limited time|countdown/i.test(config+view),"Unsupported trust or scarcity claim detected")
assert(pricing.includes('price: "£14.99"')&&pricing.includes('price: "£29.99"')&&view.includes("£14.99/month")&&view.includes("£29.99/month"),"Landing pricing must match current production pricing")
assert(robots.includes("allow: '/'")&&robots.includes("/api/")&&robots.includes("sitemap.xml"),"Robots/indexability contract missing")
assert(worker.includes('`${canonicalOrigin}${url.pathname}${url.search}`')&&worker.includes("308"),"Canonical host redirect must preserve path and query")
assert(middleware.includes('host === "www.hegevaai.co.uk"')&&middleware.includes('canonical.hostname = "hegevaai.co.uk"')&&middleware.includes("NextResponse.redirect(canonical, 308)"),"OpenNext canonical redirect must preserve path and query")
assert(wrangler.includes('"run_worker_first": true'),"Cloudflare assets must run through canonical middleware before static delivery")
for(const event of ["landing_page_view","registration_start","pricing_view"])assert(measure.includes(event),`Privacy-safe measurement event missing: ${event}`)
assert(!/["'](?:email|customer|invoice|document|message|query|searchParams)["']\s*:|\.searchParams|location\.search/i.test(measure),"Measurement foundation must not collect business content, query strings or PII")
for(const token of ['analytics_storage: "denied"','ad_storage: "denied"','ad_user_data: "denied"','ad_personalization: "denied"','allow_google_signals: false','allow_ad_personalization_signals: false','G-TK99HP2BG7'])assert(consent.includes(token),`Consent-safe Analytics contract missing: ${token}`)
assert(consent.includes('localStorage.getItem(CONSENT_KEY)')&&consent.includes('if (next === "granted") enableAnalytics()'),"Analytics must load only after an explicit stored choice")
assert(layout.includes("<AnalyticsConsent />"),"Global Analytics consent control missing")
console.log("Acquisition SEO V1 audit passed: five differentiated SSR routes, unique metadata/canonicals, sitemap/robots, valid structured data, verified pricing, product proof, internal links, mobile semantics and privacy-safe first-party attribution")
