const SUPPORTED_LOCALES = new Set(["en", "hu", "de", "fr", "es"]);

function string(value, maximum = 500) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function email(value) {
  const match = string(value, 200).match(/[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
  return match ? match[0] : "";
}

function invoiceTotal(invoice) {
  const subtotal = Array.isArray(invoice.items)
    ? invoice.items.reduce((total, item) => total + Math.max(0, Number(item?.quantity) || 0) * Math.max(0, Number(item?.unitPrice) || 0), 0)
    : 0;
  return subtotal * (1 + Math.max(0, Number(invoice.vatRate) || 0) / 100);
}

function copy(locale, values) {
  const messages = {
    en: {
      subject: `Payment reminder: ${values.number}`,
      body: `Hello ${values.customer},\n\nI am following up regarding invoice ${values.number} for ${values.amount}, which was due on ${values.dueDate}. Please let us know if you need any further information.\n\nKind regards,\n${values.business}`,
    },
    hu: {
      subject: `Fizetési emlékeztető: ${values.number}`,
      body: `Kedves ${values.customer}!\n\nA(z) ${values.number} számú, ${values.amount} összegű, ${values.dueDate} határidejű számlával kapcsolatban keresem. Kérem, jelezze, ha további információra van szüksége.\n\nÜdvözlettel,\n${values.business}`,
    },
    de: {
      subject: `Zahlungserinnerung: ${values.number}`,
      body: `Guten Tag ${values.customer},\n\nich möchte bezüglich der Rechnung ${values.number} über ${values.amount} nachfassen, die am ${values.dueDate} fällig war. Bitte teilen Sie uns mit, falls Sie weitere Informationen benötigen.\n\nMit freundlichen Grüßen\n${values.business}`,
    },
    fr: {
      subject: `Rappel de paiement : ${values.number}`,
      body: `Bonjour ${values.customer},\n\nJe reviens vers vous concernant la facture ${values.number} d'un montant de ${values.amount}, arrivée à échéance le ${values.dueDate}. N'hésitez pas à nous contacter si vous avez besoin d'informations complémentaires.\n\nCordialement,\n${values.business}`,
    },
    es: {
      subject: `Recordatorio de pago: ${values.number}`,
      body: `Hola ${values.customer},\n\nMe pongo en contacto en relación con la factura ${values.number} por un importe de ${values.amount}, que venció el ${values.dueDate}. Avísanos si necesitas más información.\n\nUn saludo,\n${values.business}`,
    },
  };
  return messages[locale] || messages.en;
}

function upgradeLegacyDraft(existing, now) {
  if (
    existing?.actionType !== "email-draft" ||
    existing?.workflowStatus !== "draft" ||
    existing?.deliveryStatus !== "not-sent" ||
    existing?.sent !== false ||
    existing?.approvalState
  ) return null;
  return {
    ...existing,
    approvalState: "awaiting-approval",
    approvalVersion: 0,
    approvedAt: null,
    approvedByActorHash: null,
    executionStatus: "not-executed",
    audit: [{
      event: "prepared",
      actionType: "email-draft",
      target: email(existing.recipient),
      previousState: "prepared",
      newState: "awaiting-approval",
      occurredAt: now,
      deliveryStatus: "not-sent",
      executionStatus: "not-executed",
    }],
  };
}

export function prepareOverdueInvoiceEmailDraft({ invoice, customers, messages, locale = "en", now = new Date().toISOString() }) {
  const today = now.slice(0, 10);
  const invoiceId = string(invoice?.id, 100);
  const number = string(invoice?.number, 100);
  const dueDate = string(invoice?.dueDate, 10);
  const customerName = string(invoice?.clientName, 200);
  const businessName = string(invoice?.businessName, 200);
  const recipient = email(invoice?.clientDetails);

  if (
    !invoiceId ||
    invoice?.type !== "invoice" ||
    invoice?.status !== "sent" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(dueDate) ||
    dueDate >= today ||
    !number ||
    !customerName ||
    !businessName ||
    !recipient
  ) {
    return { ok: false, reason: "insufficient-evidence" };
  }

  const ownedCustomer = Array.isArray(customers) && customers.some((customer) => string(customer?.title, 200) === customerName);
  if (!ownedCustomer) return { ok: false, reason: "customer-not-authorized" };

  const actionKey = `email-draft:invoice:${invoiceId}`;
  const existing = Array.isArray(messages) && messages.find((message) => message?.actionKey === actionKey);
  if (existing) {
    const upgraded = upgradeLegacyDraft(existing, now);
    return { ok: true, created: false, updated: Boolean(upgraded), draft: upgraded || existing };
  }

  const resolvedLocale = SUPPORTED_LOCALES.has(locale) ? locale : "en";
  const amount = new Intl.NumberFormat(resolvedLocale, {
    style: "currency",
    currency: /^[A-Z]{3}$/.test(string(invoice.currency, 3)) ? invoice.currency : "GBP",
  }).format(invoiceTotal(invoice));
  const wording = copy(resolvedLocale, { number, customer: customerName, dueDate, amount, business: businessName });
  const draft = {
    id: crypto.randomUUID(),
    actionKey,
    actionType: "email-draft",
    sourceId: invoiceId,
    type: "Payment reminder",
    tone: "Professional",
    recipient,
    subject: wording.subject,
    body: wording.body,
    createdAt: now,
    workflowStatus: "draft",
    approvalState: "awaiting-approval",
    approvalVersion: 0,
    approvedAt: null,
    approvedByActorHash: null,
    deliveryStatus: "not-sent",
    executionStatus: "not-executed",
    sent: false,
    evidence: { invoiceNumber: number, dueDate, amount, customerName },
    audit: [{
      event: "prepared",
      actionType: "email-draft",
      target: recipient,
      previousState: "prepared",
      newState: "awaiting-approval",
      occurredAt: now,
      deliveryStatus: "not-sent",
      executionStatus: "not-executed",
    }],
  };
  return { ok: true, created: true, draft };
}
