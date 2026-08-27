"use client"

import { CheckCircle2, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { AuthPanel } from "@/components/auth/auth-panel"
import { AICore, SignalIcon } from "@/components/visual-engine"
import { useI18n } from "@/lib/i18n/provider"
import { AUTH_COPY } from "@/lib/i18n/auth-copy"

export default function LoginPage() {
  const { locale } = useI18n()
  const c = AUTH_COPY[locale]
  const features = {
    en:["Better Auth session security","Cloudflare D1 account data","Protected AI endpoints","Password recovery checks live email availability"],
    hu:["Biztonságos Better Auth munkamenet","Cloudflare D1 fiókadatok","Védett AI-végpontok","A jelszó-visszaállítás ellenőrzi az élő email-elérhetőséget"],
    de:["Sichere Better-Auth-Sitzungen","Cloudflare-D1-Kontodaten","Geschützte KI-Endpunkte","Passwort-Wiederherstellung prüft die Live-E-Mail-Verfügbarkeit"],
    fr:["Sessions Better Auth sécurisées","Données de compte Cloudflare D1","Points d’accès IA protégés","La récupération du mot de passe vérifie la disponibilité réelle des e-mails"],
    es:["Sesiones seguras con Better Auth","Datos de cuenta en Cloudflare D1","Puntos de acceso de IA protegidos","La recuperación de contraseña comprueba la disponibilidad real del correo"],
  }[locale]

  const icons = [ShieldCheck, LockKeyhole, Sparkles, CheckCircle2]
  const tones = ["emerald", "cyan", "violet", "gold"] as const

  return (
    <AppShell>
      <main className="relative mx-auto grid min-h-[76vh] max-w-6xl gap-10 overflow-hidden px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-14">
        <div className="pointer-events-none absolute -left-28 top-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-10 h-72 w-72 rounded-full bg-violet/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-52 w-80 -translate-x-1/2 rounded-full bg-cyan/8 blur-3xl" />

        <section className="relative z-10">
          <div className="mb-6 flex items-center gap-4">
            <AICore state="active" />
            <div>
              <p className="ve-eyebrow mb-1">HEGEVA AI · SECURE ACCESS</p>
              <p className="text-xs text-muted-foreground">Business · AI · Freedom</p>
            </div>
          </div>

          <h1 className="max-w-2xl font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-[3.35rem] lg:leading-[1.08]">
            <span className="text-gradient-emerald">{c.title}</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">{c.subtitle}</p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {features.map((feature, index) => {
              const Icon = icons[index]
              return (
                <div key={feature} className={`ve-panel ve-panel-interactive ve-tone-${tones[index]} relative flex min-h-24 items-start gap-3 overflow-hidden rounded-2xl p-4`}>
                  <SignalIcon icon={Icon} tone={tones[index]} className="size-10 shrink-0 rounded-xl" />
                  <p className="pt-1 text-sm font-medium leading-5 text-foreground/85">{feature}</p>
                </div>
              )
            })}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-2"><span className="size-1.5 rounded-full bg-primary shadow-[0_0_12px_var(--primary)]" />Encrypted session</span>
            <span className="inline-flex items-center gap-2"><span className="size-1.5 rounded-full bg-cyan shadow-[0_0_12px_var(--cyan)]" />Cloud workspace</span>
            <span className="inline-flex items-center gap-2"><span className="size-1.5 rounded-full bg-violet shadow-[0_0_12px_var(--violet)]" />Protected AI</span>
          </div>
        </section>

        <div className="relative z-10">
          <div className="pointer-events-none absolute -inset-5 rounded-[2rem] bg-gradient-to-br from-primary/10 via-cyan/5 to-violet/10 blur-2xl" />
          <div className="relative rounded-[1.75rem] border border-white/10 bg-background/15 p-1 shadow-[0_32px_100px_-55px_rgba(34,211,238,.55)] backdrop-blur-sm">
            <AuthPanel />
          </div>
        </div>
      </main>
    </AppShell>
  )
}
