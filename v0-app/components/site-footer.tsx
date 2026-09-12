"use client"

import Link from "next/link"
import { CloudCog, Globe, Headphones, ShieldCheck, Wallet } from "lucide-react"
import { HegevaLogo } from "@/components/hegeva-logo"
import { useI18n } from "@/lib/i18n/provider"
import { LEGAL_COPY } from "@/lib/i18n/legal-copy"

const trustCopy = {
  en: { encrypted: "Encrypted connections", cloud: "Cloud workspace sync", languages: "5 languages", support: "Contact support", fees: "No hidden HEGEVA fees" },
  hu: { encrypted: "Titkosított kapcsolat", cloud: "Felhőalapú szinkron", languages: "5 nyelv", support: "Kapcsolati támogatás", fees: "Nincs rejtett HEGEVA-díj" },
  de: { encrypted: "Verschlüsselte Verbindungen", cloud: "Cloud-Arbeitsbereich-Sync", languages: "5 Sprachen", support: "Kontakt-Support", fees: "Keine versteckten HEGEVA-Gebühren" },
  fr: { encrypted: "Connexions chiffrées", cloud: "Synchronisation cloud", languages: "5 langues", support: "Assistance par contact", fees: "Aucun frais HEGEVA caché" },
  es: { encrypted: "Conexiones cifradas", cloud: "Sincronización en la nube", languages: "5 idiomas", support: "Soporte por contacto", fees: "Sin cargos HEGEVA ocultos" },
} as const

export function SiteFooter() {
  const { t, locale } = useI18n()
  const legal = LEGAL_COPY[locale]
  const c = trustCopy[locale]

  const trust = [
    { icon: ShieldCheck, label: c.encrypted },
    { icon: CloudCog, label: c.cloud },
    { icon: Globe, label: `${c.languages} · EN | HU | DE | FR | ES` },
    { icon: Headphones, label: c.support },
    { icon: Wallet, label: c.fees },
  ]

  return (
    <footer className="border-t border-border bg-background/60">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {trust.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10">
                <Icon className="size-4 text-primary" aria-hidden />
              </span>
              <span className="text-balance text-xs font-medium leading-tight text-muted-foreground">{label}</span>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <HegevaLogo href={null} />
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t.footer.tagline}</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <Link href="/privacy" className="transition-colors hover:text-foreground">{legal.privacyLink}</Link>
            <Link href="/terms" className="transition-colors hover:text-foreground">{legal.termsLink}</Link>
            <span>© {new Date().getFullYear()} HEGEVA AI</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
