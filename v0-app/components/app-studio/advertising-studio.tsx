"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, Loader2, Megaphone, Pencil, Save, Sparkles, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { useI18n } from "@/lib/i18n/provider";
import { useWorkspaceData } from "@/lib/use-workspace-data";
import {
  ADVERTISING_CHANNELS,
  ADVERTISING_LANGUAGES,
  prepareAdvertisingWorkflow,
  validateAdvertisingBrief,
  type AdvertisingBrief,
  type AdvertisingChannel,
  type AdvertisingLanguage,
} from "@/lib/advertising-workflows";
import { generateAdvertisingCampaign, generateAdvertisingImage } from "@/lib/advertising-ai";

type Mode = "improve" | "create";
type Saved = AdvertisingBrief & {
  id: string;
  createdAt: string;
  updatedAt: string;
  mode: Mode;
  generatedOutput?: string;
};
const copy = {
  en: {
    eyebrow: "HEGEVA / ADVERTISING STUDIO",
    title: "Advertising Studio",
    subtitle:
      "Analyse advertising, strengthen the offer and CTA, then create channel-ready campaign variations with HEGEVA AI.",
    improve: "Improve an advertisement",
    create: "Create an advertisement",
    source: "Advertisement text",
    product: "Product or service",
    audience: "Target audience",
    objective: "Campaign objective",
    channel: "Channel",
    url: "Source URL (optional)",
    offer: "Offer (optional)",
    cta: "Call to action (optional)",
    media: "Media description (optional)",
    tone: "Tone (optional)",
    benefits: "Key benefits (one per line)",
    restrictions: "Restrictions (one per line)",
    language: "Output language",
    save: "Save draft",
    saved: "Saved",
    edit: "Edit",
    duplicate: "Duplicate",
    remove: "Delete",
    empty: "No advertising drafts yet.",
    provider: "AI generation with owner control",
    providerBody:
      "Generation uses your authenticated HEGEVA allowance. Results remain editable drafts and are never published automatically.",
    invalid:
      "Please complete the required fields and correct the highlighted values.",
    signIn:
      "Sign in to sync advertising drafts. Guests can still work locally.",
    preview: "Structured brief preview",
    deleteConfirm: "Delete this draft?",
    newDraft: "New draft",
    back: "Back to App Studio",
    generate: "Generate campaign", generating: "HEGEVA is creating…", result: "Campaign result", copyResult: "Copy result", copied: "Copied", aiError: "The campaign could not be generated. Check your account and try again.", aiSignIn: "Sign in to use live HEGEVA AI generation.",
  },
  hu: {
    eyebrow: "HEGEVA / HIRDETÉSI STÚDIÓ",
    title: "Hirdetési Stúdió",
    subtitle:
      "Elemezd a reklámot, erősítsd az ajánlatot és a CTA-t, majd készíts csatornára szabott kampányváltozatokat HEGEVA AI-jal.",
    improve: "Hirdetés javítása",
    create: "Hirdetés létrehozása",
    source: "Hirdetés szövege",
    product: "Termék vagy szolgáltatás",
    audience: "Célközönség",
    objective: "Kampánycél",
    channel: "Csatorna",
    url: "Forrás URL (opcionális)",
    offer: "Ajánlat (opcionális)",
    cta: "Cselekvésre ösztönzés (opcionális)",
    media: "Médiatartalom leírása (opcionális)",
    tone: "Hangnem (opcionális)",
    benefits: "Fő előnyök (soronként egy)",
    restrictions: "Korlátozások (soronként egy)",
    language: "Kimeneti nyelv",
    save: "Vázlat mentése",
    saved: "Mentve",
    edit: "Szerkesztés",
    duplicate: "Duplikálás",
    remove: "Törlés",
    empty: "Még nincs hirdetési vázlat.",
    provider: "AI-generálás tulajdonosi kontrollal",
    providerBody:
      "A generálás a hitelesített HEGEVA-keretedet használja. Az eredmények szerkeszthető vázlatok, automatikus közzététel nincs.",
    invalid: "Töltsd ki a kötelező mezőket és javítsd a jelzett értékeket.",
    signIn:
      "Jelentkezz be a vázlatok szinkronizálásához. Vendégként helyben is dolgozhatsz.",
    preview: "Strukturált vázlat előnézete",
    deleteConfirm: "Törlöd ezt a vázlatot?",
    newDraft: "Új vázlat",
    back: "Vissza az App Stúdióba",
    generate: "Kampány létrehozása", generating: "A HEGEVA dolgozik…", result: "Kampányeredmény", copyResult: "Eredmény másolása", copied: "Másolva", aiError: "A kampány nem hozható létre. Ellenőrizd a fiókodat, majd próbáld újra.", aiSignIn: "Jelentkezz be az élő HEGEVA AI-generáláshoz.",
  },
  de: {
    eyebrow: "HEGEVA / WERBESTUDIO",
    title: "Werbestudio",
    subtitle:
      "Analysieren Sie Werbung, stärken Sie Angebot und CTA und erstellen Sie kanalgerechte Varianten mit HEGEVA AI.",
    improve: "Werbung verbessern",
    create: "Werbung erstellen",
    source: "Werbetext",
    product: "Produkt oder Dienstleistung",
    audience: "Zielgruppe",
    objective: "Kampagnenziel",
    channel: "Kanal",
    url: "Quell-URL (optional)",
    offer: "Angebot (optional)",
    cta: "Call-to-Action (optional)",
    media: "Medienbeschreibung (optional)",
    tone: "Ton (optional)",
    benefits: "Hauptvorteile (je eine Zeile)",
    restrictions: "Einschränkungen (je eine Zeile)",
    language: "Ausgabesprache",
    save: "Entwurf speichern",
    saved: "Gespeichert",
    edit: "Bearbeiten",
    duplicate: "Duplizieren",
    remove: "Löschen",
    empty: "Noch keine Werbeentwürfe.",
    provider: "KI-Generierung mit Eigentümerkontrolle",
    providerBody:
      "Die Generierung nutzt Ihr HEGEVA-Kontingent. Ergebnisse bleiben bearbeitbare Entwürfe und werden nie automatisch veröffentlicht.",
    invalid: "Bitte Pflichtfelder ausfüllen und Werte korrigieren.",
    signIn: "Anmelden, um Entwürfe zu synchronisieren.",
    preview: "Strukturierte Briefing-Vorschau",
    deleteConfirm: "Diesen Entwurf löschen?",
    newDraft: "Neuer Entwurf",
    back: "Zurück zu App Studio",
    generate: "Kampagne erstellen", generating: "HEGEVA erstellt…", result: "Kampagnenergebnis", copyResult: "Ergebnis kopieren", copied: "Kopiert", aiError: "Die Kampagne konnte nicht erstellt werden. Konto prüfen und erneut versuchen.", aiSignIn: "Anmelden, um die echte HEGEVA-KI zu verwenden.",
  },
  fr: {
    eyebrow: "HEGEVA / STUDIO PUBLICITAIRE",
    title: "Studio publicitaire",
    subtitle:
      "Analysez la publicité, renforcez l’offre et le CTA, puis créez des variantes adaptées avec HEGEVA AI.",
    improve: "Améliorer une publicité",
    create: "Créer une publicité",
    source: "Texte publicitaire",
    product: "Produit ou service",
    audience: "Public cible",
    objective: "Objectif de campagne",
    channel: "Canal",
    url: "URL source (facultatif)",
    offer: "Offre (facultatif)",
    cta: "Appel à l’action (facultatif)",
    media: "Description média (facultatif)",
    tone: "Ton (facultatif)",
    benefits: "Avantages clés (une ligne)",
    restrictions: "Restrictions (une ligne)",
    language: "Langue de sortie",
    save: "Enregistrer le brouillon",
    saved: "Enregistré",
    edit: "Modifier",
    duplicate: "Dupliquer",
    remove: "Supprimer",
    empty: "Aucun brouillon publicitaire.",
    provider: "Génération IA sous votre contrôle",
    providerBody:
      "La génération utilise votre quota HEGEVA authentifié. Les résultats restent des brouillons modifiables et ne sont jamais publiés automatiquement.",
    invalid: "Remplissez les champs obligatoires et corrigez les valeurs.",
    signIn: "Connectez-vous pour synchroniser les brouillons.",
    preview: "Aperçu du brief structuré",
    deleteConfirm: "Supprimer ce brouillon ?",
    newDraft: "Nouveau brouillon",
    back: "Retour à App Studio",
    generate: "Créer la campagne", generating: "HEGEVA crée…", result: "Résultat de campagne", copyResult: "Copier le résultat", copied: "Copié", aiError: "La campagne n’a pas pu être créée. Vérifiez votre compte et réessayez.", aiSignIn: "Connectez-vous pour utiliser la génération HEGEVA AI réelle.",
  },
  es: {
    eyebrow: "HEGEVA / ESTUDIO PUBLICITARIO",
    title: "Estudio publicitario",
    subtitle:
      "Analiza el anuncio, mejora la oferta y el CTA y crea variantes por canal con HEGEVA AI.",
    improve: "Mejorar un anuncio",
    create: "Crear un anuncio",
    source: "Texto del anuncio",
    product: "Producto o servicio",
    audience: "Público objetivo",
    objective: "Objetivo de campaña",
    channel: "Canal",
    url: "URL de origen (opcional)",
    offer: "Oferta (opcional)",
    cta: "Llamada a la acción (opcional)",
    media: "Descripción multimedia (opcional)",
    tone: "Tono (opcional)",
    benefits: "Beneficios clave (una línea)",
    restrictions: "Restricciones (una línea)",
    language: "Idioma de salida",
    save: "Guardar borrador",
    saved: "Guardado",
    edit: "Editar",
    duplicate: "Duplicar",
    remove: "Eliminar",
    empty: "Aún no hay borradores publicitarios.",
    provider: "Generación con IA bajo tu control",
    providerBody:
      "La generación usa tu cuota HEGEVA autenticada. Los resultados siguen siendo borradores editables y nunca se publican automáticamente.",
    invalid: "Completa los campos obligatorios y corrige los valores.",
    signIn: "Inicia sesión para sincronizar borradores.",
    preview: "Vista previa del briefing",
    deleteConfirm: "¿Eliminar este borrador?",
    newDraft: "Nuevo borrador",
    back: "Volver a App Studio",
    generate: "Crear campaña", generating: "HEGEVA está creando…", result: "Resultado de campaña", copyResult: "Copiar resultado", copied: "Copiado", aiError: "No se pudo crear la campaña. Revisa tu cuenta e inténtalo de nuevo.", aiSignIn: "Inicia sesión para usar la generación real de HEGEVA AI.",
  },
} as const;
const providerCopy={en:{visual:"Generate visual",download:"Export image",review:"AI draft · review before use",credits:"credits remaining"},hu:{visual:"Kép generálása",download:"Kép exportálása",review:"AI-vázlat · használat előtt ellenőrizendő",credits:"felhasználható kredit"},de:{visual:"Visual generieren",download:"Bild exportieren",review:"KI-Entwurf · vor Nutzung prüfen",credits:"Credits verfügbar"},fr:{visual:"Générer le visuel",download:"Exporter l’image",review:"Brouillon IA · à vérifier avant usage",credits:"crédits disponibles"},es:{visual:"Generar visual",download:"Exportar imagen",review:"Borrador de IA · revisar antes de usar",credits:"créditos disponibles"}} as const;
const channelLabels: Record<
  keyof typeof copy,
  Record<AdvertisingChannel, string>
> = {
  en: {
    website: "Website",
    email: "Email",
    instagram: "Instagram",
    facebook: "Facebook",
    linkedin: "LinkedIn",
    tiktok: "TikTok",
    search: "Search",
  },
  hu: {
    website: "Weboldal",
    email: "E-mail",
    instagram: "Instagram",
    facebook: "Facebook",
    linkedin: "LinkedIn",
    tiktok: "TikTok",
    search: "Keresési hirdetés",
  },
  de: {
    website: "Website",
    email: "E-Mail",
    instagram: "Instagram",
    facebook: "Facebook",
    linkedin: "LinkedIn",
    tiktok: "TikTok",
    search: "Suchanzeige",
  },
  fr: {
    website: "Site web",
    email: "E-mail",
    instagram: "Instagram",
    facebook: "Facebook",
    linkedin: "LinkedIn",
    tiktok: "TikTok",
    search: "Annonce de recherche",
  },
  es: {
    website: "Sitio web",
    email: "Correo electrónico",
    instagram: "Instagram",
    facebook: "Facebook",
    linkedin: "LinkedIn",
    tiktok: "TikTok",
    search: "Anuncio de búsqueda",
  },
};
const languageLabels: Record<
  keyof typeof copy,
  Record<AdvertisingLanguage, string>
> = {
  en: {
    en: "English",
    hu: "Hungarian",
    de: "German",
    fr: "French",
    es: "Spanish",
  },
  hu: { en: "Angol", hu: "Magyar", de: "Német", fr: "Francia", es: "Spanyol" },
  de: {
    en: "Englisch",
    hu: "Ungarisch",
    de: "Deutsch",
    fr: "Französisch",
    es: "Spanisch",
  },
  fr: {
    en: "Anglais",
    hu: "Hongrois",
    de: "Allemand",
    fr: "Français",
    es: "Espagnol",
  },
  es: {
    en: "Inglés",
    hu: "Húngaro",
    de: "Alemán",
    fr: "Francés",
    es: "Español",
  },
};
const blank = (
  mode: Mode,
  language: AdvertisingBrief["language"],
): AdvertisingBrief => ({
  schemaVersion: "0.1",
  kind:
    mode === "improve"
      ? "advertisement-improver-brief"
      : "advertisement-creator-brief",
  productOrService: "",
  targetAudience: "",
  campaignObjective: "",
  channel: "website",
  language,
  ...(mode === "improve" ? { advertisementText: "" } : {}),
});
export function AdvertisingStudio() {
  const { locale } = useI18n();
  const t = copy[locale];
  const channels = channelLabels[locale];
  const languages = languageLabels[locale];
  const { items, setItems, syncState, syncError, cloudEnabled } =
    useWorkspaceData<Saved>("advertising_drafts");
  const [mode, setMode] = useState<Mode>("improve");
  const [brief, setBrief] = useState<AdvertisingBrief>(() =>
    blank("improve", locale),
  );
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [generatedOutput, setGeneratedOutput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedImage,setGeneratedImage]=useState("");
  const [creditsRemaining,setCreditsRemaining]=useState<number|null>(null);
  const update = (key: string, value: string) =>
    setBrief((v) => ({ ...v, [key]: value }));
  const save = () => {
    setError("");
    try {
      const clean = validateAdvertisingBrief({
        ...brief,
        keyBenefits: brief.keyBenefits || [],
        restrictions: brief.restrictions || [],
      });
      const now = new Date().toISOString();
      const item = {
        ...clean,
        id: editing || crypto.randomUUID(),
        mode,
        createdAt: items.find((x) => x.id === editing)?.createdAt || now,
        updatedAt: now,
        ...(generatedOutput ? { generatedOutput } : {}),
      };
      setItems((xs) =>
        [item, ...xs.filter((x) => x.id !== item.id)].slice(0, 100),
      );
      setEditing(item.id);
      setBrief(clean);
      setNotice(t.saved);
    } catch {
      setError(t.invalid);
    }
  };
  const generate = async () => {
    if (generating) return;
    setError(""); setNotice("");
    try {
      const clean = validateAdvertisingBrief({ ...brief, keyBenefits: brief.keyBenefits || [], restrictions: brief.restrictions || [] });
      if (!cloudEnabled) throw new Error("sign-in");
      setGenerating(true);
      const result = await generateAdvertisingCampaign(clean);
      setGeneratedOutput(result.text); setCreditsRemaining(Number.isFinite(result.credits?.remaining)?result.credits.remaining:null);
      const now = new Date().toISOString(), id = editing || crypto.randomUUID();
      const item: Saved = { ...clean, id, mode, generatedOutput: result.text, createdAt: items.find((x) => x.id === id)?.createdAt || now, updatedAt: now };
      setItems((all) => [item, ...all.filter((x) => x.id !== id)].slice(0, 100));
      setEditing(id); setBrief(clean);
    } catch (cause) {
      setError(cause instanceof Error && cause.message === "sign-in" ? t.aiSignIn : t.aiError);
    } finally { setGenerating(false); }
  };
  const generateVisual=async()=>{if(generating)return;setError("");setNotice("");try{const clean=validateAdvertisingBrief({...brief,keyBenefits:brief.keyBenefits||[],restrictions:brief.restrictions||[]});if(!cloudEnabled)throw new Error("sign-in");setGenerating(true);const result=await generateAdvertisingImage(clean);setGeneratedImage(result.image);setCreditsRemaining(Number.isFinite(result.credits?.remaining)?result.credits.remaining:null)}catch(cause){setError(cause instanceof Error&&cause.message==="sign-in"?t.aiSignIn:t.aiError)}finally{setGenerating(false)}};
  const prepared = (() => {
    try {
      return prepareAdvertisingWorkflow(validateAdvertisingBrief(brief));
    } catch {
      return null;
    }
  })();
  const input =
    "mt-2 w-full min-w-0 rounded-xl border border-input bg-input/30 px-3.5 py-3 text-sm outline-none focus:border-primary/70 focus:ring-2 focus:ring-primary/20";
  const fields = [
    ["productOrService", t.product, 160],
    ["targetAudience", t.audience, 160],
    ["campaignObjective", t.objective, 160],
    ["sourceUrl", t.url, 300],
    ["offer", t.offer, 240],
    ["callToAction", t.cta, 120],
    ["mediaDescription", t.media, 300],
    ["tone", t.tone, 80],
  ] as const;
  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow={t.eyebrow}
          title={t.title}
          subtitle={t.subtitle}
          action={
            <Link
              href="/app-studio"
              className="hegeva-secondary inline-flex min-h-11 items-center px-4 text-sm"
            >
              {t.back}
            </Link>
          }
        />
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setMode("improve");
              setBrief(blank("improve", locale));
              setEditing(null);
              setGeneratedOutput("");
            }}
            className={`min-h-11 rounded-xl border px-4 text-sm font-semibold ${mode === "improve" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
          >
            {t.improve}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("create");
              setBrief(blank("create", locale));
              setEditing(null);
              setGeneratedOutput("");
            }}
            className={`min-h-11 rounded-xl border px-4 text-sm font-semibold ${mode === "create" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
          >
            {t.create}
          </button>
        </div>
        <div className="mt-7 grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <section className="glass-panel min-w-0 rounded-3xl p-5 sm:p-7">
            <div className="grid min-w-0 gap-5 md:grid-cols-2">
              <label className="text-sm font-medium md:col-span-2">
                {t.source}
                <textarea
                  disabled={mode !== "improve"}
                  value={String(brief.advertisementText || "")}
                  onChange={(e) => update("advertisementText", e.target.value)}
                  maxLength={1200}
                  rows={4}
                  className={input}
                />
              </label>
              {fields.map(([key, label, max]) => (
                <label key={key} className="min-w-0 text-sm font-medium">
                  {label}
                  <input
                    value={String(brief[key] || "")}
                    maxLength={max}
                    onChange={(e) => update(key, e.target.value)}
                    className={input}
                  />
                </label>
              ))}
              <label className="text-sm font-medium">
                {t.channel}
                <select
                  value={brief.channel}
                  onChange={(e) => update("channel", e.target.value)}
                  className={input}
                >
                  {ADVERTISING_CHANNELS.map((x) => (
                    <option value={x} key={x}>
                      {channels[x]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium">
                {t.language}
                <select
                  value={brief.language}
                  onChange={(e) => update("language", e.target.value)}
                  className={input}
                >
                  {ADVERTISING_LANGUAGES.map((x) => (
                    <option value={x} key={x}>
                      {languages[x]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium">
                {t.benefits}
                <textarea
                  value={(brief.keyBenefits || []).join("\n")}
                  onChange={(e) => update("keyBenefits", e.target.value)}
                  rows={3}
                  className={input}
                />
              </label>
              <label className="text-sm font-medium">
                {t.restrictions}
                <textarea
                  value={(brief.restrictions || []).join("\n")}
                  onChange={(e) => update("restrictions", e.target.value)}
                  rows={3}
                  className={input}
                />
              </label>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={save}
                className="hegeva-primary inline-flex min-h-11 items-center gap-2 px-5 text-sm font-semibold"
              >
                <Save className="size-4" aria-hidden />
                {t.save}
              </button>
              <button type="button" disabled={generating||!prepared} onClick={()=>void generateVisual()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-gold/40 bg-gold/10 px-5 text-sm font-semibold text-gold disabled:opacity-50"><Sparkles className="size-4" aria-hidden/>{providerCopy[locale].visual}</button>
              <button
                type="button"
                disabled={generating || !prepared}
                onClick={() => void generate()}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-5 text-sm font-semibold text-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generating ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Sparkles className="size-4" aria-hidden />}
                {generating ? t.generating : t.generate}
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={() => {
                    setEditing(null);
                    setBrief(blank(mode, locale));
                    setGeneratedOutput("");
                  }}
                  className="hegeva-secondary min-h-11 px-4 text-sm"
                >
                  {t.newDraft}
                </button>
              )}
            </div>
            {generatedOutput && (
              <section className="mt-7 rounded-2xl border border-primary/30 bg-primary/[.06] p-5" aria-live="polite">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="flex-1 font-display text-xl font-semibold">{t.result}</h2>
                  <button type="button" onClick={() => void navigator.clipboard.writeText(generatedOutput).then(() => setNotice(t.copied))} className="hegeva-secondary inline-flex min-h-10 items-center gap-2 px-3 text-xs">
                    <Copy className="size-3" aria-hidden />{t.copyResult}
                  </button>
                </div>
                <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-foreground">{generatedOutput}</div>
              </section>
            )}
            {generatedImage&&<section className="mt-7 rounded-2xl border border-gold/30 bg-gold/[.05] p-5" aria-live="polite"><p className="mb-3 text-xs font-semibold text-gold">{providerCopy[locale].review}</p><img src={generatedImage} alt={brief.mediaDescription||brief.productOrService} className="w-full rounded-xl border border-border"/><a href={generatedImage} download="hegeva-ad-visual.jpg" className="hegeva-secondary mt-4 inline-flex min-h-11 items-center px-4 text-sm">{providerCopy[locale].download}</a></section>}
            {creditsRemaining!==null&&<p role="status" className="mt-3 text-xs text-muted-foreground">{creditsRemaining} {providerCopy[locale].credits}</p>}
            {error && (
              <p role="alert" className="mt-4 text-sm text-destructive">
                {error}
              </p>
            )}
            {notice && (
              <p role="status" className="mt-4 text-sm text-primary">
                {notice}
              </p>
            )}
            <div className="mt-7 rounded-2xl border border-gold/25 bg-gold/5 p-4">
              <p className="font-semibold text-gold">{t.provider}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {t.providerBody}
              </p>
            </div>
          </section>
          <aside className="min-w-0 space-y-4">
            <div className="glass-panel rounded-3xl p-5">
              <h2 className="flex items-center gap-2 font-display text-lg">
                <Megaphone className="size-5 text-primary" aria-hidden />
                {t.preview}
              </h2>
              {prepared ? (
                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground">{t.product}</dt>
                    <dd className="font-medium">
                      {prepared.brief.productOrService}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">{t.audience}</dt>
                    <dd className="font-medium">
                      {prepared.brief.targetAudience}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">{t.channel}</dt>
                    <dd className="font-medium">
                      {channels[prepared.brief.channel]}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  {t.invalid}
                </p>
              )}
            </div>
            <div className="glass-panel rounded-3xl p-5">
              <h2 className="font-semibold">{t.saved}</h2>
              <p className="mt-2 text-xs text-muted-foreground">
                {syncState}
                {!cloudEnabled && ` · ${t.signIn}`}
                {syncError && ` · ${syncError}`}
              </p>
              <div className="mt-4 space-y-3">
                {items.length === 0 && (
                  <p className="text-sm text-muted-foreground">{t.empty}</p>
                )}
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-border p-3"
                  >
                    <p className="truncate text-sm font-semibold">
                      {item.productOrService}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {channels[item.channel]}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setMode(item.mode);
                          setEditing(item.id);
                          setBrief(item);
                          setGeneratedOutput(item.generatedOutput || "");
                        }}
                        className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-border px-3 text-xs"
                      >
                        <Pencil className="size-3" aria-hidden />
                        {t.edit}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setItems((xs) => [
                            {
                              ...item,
                              id: crypto.randomUUID(),
                              createdAt: new Date().toISOString(),
                              updatedAt: new Date().toISOString(),
                            },
                            ...xs,
                          ])
                        }
                        className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-border px-3 text-xs"
                      >
                        <Copy className="size-3" aria-hidden />
                        {t.duplicate}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(t.deleteConfirm)) {
                            setItems((xs) =>
                              xs.filter((x) => x.id !== item.id),
                            );
                          }
                        }}
                        className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-destructive/40 px-3 text-xs text-destructive"
                      >
                        <Trash2 className="size-3" aria-hidden />
                        {t.remove}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </AppShell>
  );
}
