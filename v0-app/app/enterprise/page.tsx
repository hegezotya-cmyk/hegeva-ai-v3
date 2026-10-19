"use client"

import { EnterpriseCompletion } from "@/components/enterprise/enterprise-completion"
import { AppShell } from "@/components/app-shell"
import { PageHeader } from "@/components/page-header"
import { useSession } from "@/lib/auth-client"
import { useI18n } from "@/lib/i18n/provider"

const GUEST_COPY = {
  en: { title: "Enterprise", body: "Contact us to discuss your organization’s workspace needs, or review the current plans. Workspace configuration is available after signing in.", contact: "Contact us", pricing: "View pricing", loading: "Checking your session…" },
  hu: { title: "Vállalati munkaterület", body: "Vedd fel velünk a kapcsolatot a szervezeted munkaterületi igényeiről, vagy tekintsd meg a jelenlegi csomagokat. A munkaterület beállításai bejelentkezés után érhetők el.", contact: "Kapcsolatfelvétel", pricing: "Csomagok megtekintése", loading: "Munkamenet ellenőrzése…" },
  de: { title: "Enterprise", body: "Kontaktieren Sie uns zu den Workspace-Anforderungen Ihrer Organisation oder sehen Sie sich die aktuellen Tarife an. Die Workspace-Konfiguration ist nach der Anmeldung verfügbar.", contact: "Kontakt aufnehmen", pricing: "Tarife ansehen", loading: "Sitzung wird geprüft…" },
  fr: { title: "Entreprise", body: "Contactez-nous pour discuter des besoins de votre organisation ou consultez les offres actuelles. La configuration de l’espace est disponible après connexion.", contact: "Nous contacter", pricing: "Voir les tarifs", loading: "Vérification de la session…" },
  es: { title: "Empresa", body: "Contacta con nosotros para hablar de las necesidades de tu organización o consulta los planes actuales. La configuración del espacio está disponible después de iniciar sesión.", contact: "Contactar", pricing: "Ver precios", loading: "Comprobando tu sesión…" },
} as const

export default function EnterprisePage() {
  const { data: session, isPending } = useSession()
  const { locale } = useI18n()
  const c = GUEST_COPY[locale]

  if (!isPending && session?.user) return <EnterpriseCompletion />

  return <AppShell>
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader eyebrow="HEGEVA ENTERPRISE" title={c.title} subtitle={isPending ? c.loading : c.body} />
      {!isPending && <div className="mt-8 flex flex-wrap gap-3">
        <a href="/contact" className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-primary-foreground">{c.contact}</a>
        <a href="/pricing" className="inline-flex min-h-11 items-center rounded-lg border px-4">{c.pricing}</a>
      </div>}
    </main>
  </AppShell>
}
