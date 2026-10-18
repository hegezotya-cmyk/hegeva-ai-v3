import type { Locale } from './i18n/dictionaries'

export const QUOTE_WORKFLOW_COPY: Record<Locale, {
  customerSync: string; loading: string; customer: string; customerLink: string; recipient: string;
  save: string; signin: string; openMessages: string; currency: string;
  followUp: string; review: string;
}> = {
  en: { customerSync: 'Wait for customer cloud sync. If it fails, reload the page before preparing the draft.', loading: 'Loading workspace…', customer: 'Save this customer in CRM first, then select them on the quote.', customerLink: 'Open customers / CRM', recipient: 'Add the customer’s email address to the client contact details, then save the quote.', save: 'Save your changes and wait for cloud sync before preparing the email draft.', signin: 'Sign in to prepare an email draft from a saved quote.', openMessages: 'Open email drafts', currency: 'Currency', followUp: 'Follow up', review: 'Review the quote before sending.' },
  hu: { customerSync: 'Várd meg az ügyfelek felhőszinkronját. Hiba esetén töltsd újra az oldalt a piszkozat előkészítése előtt.', loading: 'Betöltés…', customer: 'Először mentsd el ezt az ügyfelet a CRM-ben, majd válaszd ki az ajánlaton.', customerLink: 'Ügyfelek / CRM megnyitása', recipient: 'Add meg az ügyfél e-mail-címét az ügyfél elérhetőségeinél, majd mentsd az ajánlatot.', save: 'Mentsd a módosításokat, és várd meg a felhőszinkront az e-mail-piszkozat előkészítése előtt.', signin: 'Jelentkezz be a mentett ajánlat e-mail-piszkozatának előkészítéséhez.', openMessages: 'E-mail-piszkozatok megnyitása', currency: 'Pénznem', followUp: 'Utánkövetés', review: 'Küldés előtt ellenőrizd az ajánlatot.' },
  de: { customerSync: 'Warten Sie auf die Cloud-Synchronisierung der Kunden. Laden Sie die Seite bei einem Fehler neu.', loading: 'Arbeitsbereich wird geladen…', customer: 'Speichern Sie diesen Kunden zuerst im CRM und wählen Sie ihn im Angebot aus.', customerLink: 'Kunden / CRM öffnen', recipient: 'Ergänzen Sie die E-Mail-Adresse in den Kundenkontaktdaten und speichern Sie das Angebot.', save: 'Speichern Sie Ihre Änderungen und warten Sie vor dem E-Mail-Entwurf auf die Cloud-Synchronisierung.', signin: 'Melden Sie sich an, um einen E-Mail-Entwurf vorzubereiten.', openMessages: 'E-Mail-Entwürfe öffnen', currency: 'Währung', followUp: 'Nachfassen', review: 'Prüfen Sie das Angebot vor dem Versand.' },
  fr: { customerSync: 'Attendez la synchronisation des clients. En cas d’erreur, rechargez la page.', loading: 'Chargement de l’espace de travail…', customer: 'Enregistrez ce client dans le CRM, puis sélectionnez-le dans le devis.', customerLink: 'Ouvrir les clients / CRM', recipient: 'Ajoutez l’adresse e-mail aux coordonnées du client, puis enregistrez le devis.', save: 'Enregistrez les modifications et attendez la synchronisation cloud avant de préparer le brouillon.', signin: 'Connectez-vous pour préparer un brouillon d’e-mail.', openMessages: 'Ouvrir les brouillons d’e-mail', currency: 'Devise', followUp: 'Relance', review: 'Vérifiez le devis avant de l’envoyer.' },
  es: { customerSync: 'Espera a la sincronización de clientes. Si falla, recarga la página.', loading: 'Cargando espacio de trabajo…', customer: 'Guarda primero este cliente en el CRM y selecciónalo en el presupuesto.', customerLink: 'Abrir clientes / CRM', recipient: 'Añade el correo a los datos de contacto del cliente y guarda el presupuesto.', save: 'Guarda los cambios y espera a la sincronización antes de preparar el borrador.', signin: 'Inicia sesión para preparar un borrador de correo.', openMessages: 'Abrir borradores de correo', currency: 'Moneda', followUp: 'Seguimiento', review: 'Revisa el presupuesto antes de enviarlo.' },
}

type Quote = { id: string; clientName: string; clientDetails: string }
export type QuoteDraftIssue = 'customer' | 'recipient' | 'save' | 'signin' | 'customerSync' | null
export function quoteDraftIssue(quote: Quote, customers: { title: string }[], state: string, cloudEnabled: boolean, savedQuotes: unknown[], customerState = "cloud"): QuoteDraftIssue {
  if (state === 'checking') return 'save'
  if (!cloudEnabled) return 'signin'
  if (customerState !== 'cloud') return 'customerSync'
  if (state !== 'cloud' || !savedQuotes.some(saved => JSON.stringify(saved) === JSON.stringify(quote))) return 'save'
  if (!customers.some(customer => typeof customer.title === 'string' && customer.title.trim() === quote.clientName.trim())) return 'customer'
  if (!/[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(quote.clientDetails)) return 'recipient'
  return null
}

type PaymentFollowUpInvoice = {
  type: string; status?: string; dueDate: string; vatRate?: number;
  items?: { quantity?: number | string; unitPrice?: number | string }[];
}

export function paymentFollowUpSummary(invoice: PaymentFollowUpInvoice, onDate = new Date().toISOString().slice(0, 10)): { daysLate: number; total: number } | null {
  if (invoice.type !== 'invoice' || invoice.status !== 'sent' || !/^\d{4}-\d{2}-\d{2}$/.test(invoice.dueDate) || invoice.dueDate >= onDate) return null
  const due = Date.parse(`${invoice.dueDate}T00:00:00Z`)
  const current = Date.parse(`${onDate}T00:00:00Z`)
  if (!Number.isFinite(due) || !Number.isFinite(current)) return null
  const subtotal = Array.isArray(invoice.items) ? invoice.items.reduce((sum, item) => sum + Math.max(0, Number(item.quantity) || 0) * Math.max(0, Number(item.unitPrice) || 0), 0) : 0
  return { daysLate: Math.floor((current - due) / 86_400_000), total: subtotal * (1 + Math.max(0, Number(invoice.vatRate) || 0) / 100) }
}

export function paymentDraftIssue(invoice: Quote, customers: { title: string }[], state: string, cloudEnabled: boolean, savedInvoices: unknown[], customerState = "cloud"): QuoteDraftIssue {
  const issue = quoteDraftIssue(invoice, customers, state, cloudEnabled, savedInvoices, customerState)
  if (issue) return issue
  return /[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(invoice.clientDetails.trim().slice(0, 200)) ? null : 'recipient'
}

