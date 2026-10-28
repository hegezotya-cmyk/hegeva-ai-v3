import type { Locale } from "./dictionaries"

type ReengagementCopy = {
  filter: string; contact: string; invalidDate: string; unknown: string; due: string; inactive: string
  criteria: string; noResults: string; empty: string; prepare: string; preview: string; message: string
  boundary: string; copy: string; copied: string; copyFailed: string; close: string
  template: (name: string) => string
}

export const customerReengagementCopy: Record<Locale, ReengagementCopy> = {
  en: {
    filter: "Re-engage customers", contact: "Last contact date", invalidDate: "Choose a valid contact date that is not in the future.", unknown: "Not recorded",
    due: "Follow-up is due", inactive: "Last recorded contact was at least 90 days ago",
    criteria: "Active customers with a due follow-up or last recorded contact at least 90 days ago. A future follow-up postpones this suggestion.",
    noResults: "No customers match this view", empty: "Try another search, or record a follow-up or last contact date. Missing dates do not prove inactivity.",
    prepare: "Prepare message", preview: "Message preview", message: "Message text", boundary: "Preview only — not sent and not saved to Messages. Review and copy the text when ready.",
    copy: "Copy text", copied: "Copied", copyFailed: "Could not copy. Select the text and copy it manually.", close: "Close preview",
    template: name => `Hello ${name},\n\nI wanted to check in and ask whether there is anything you would like to discuss or need help with. Please let me know when convenient.\n\nKind regards`,
  },
  hu: {
    filter: "Újra megkeresendő", contact: "Utolsó kapcsolatfelvétel", invalidDate: "Adj meg érvényes, nem jövőbeli kapcsolatfelvételi dátumot.", unknown: "Nincs rögzítve",
    due: "Esedékes utánkövetés", inactive: "Legalább 90 napja volt az utolsó rögzített kapcsolatfelvétel",
    criteria: "Aktív ügyfelek esedékes utánkövetéssel vagy legalább 90 napja rögzített kapcsolatfelvétellel. A későbbre tervezett utánkövetés elhalasztja a javaslatot.",
    noResults: "Nincs a nézetnek megfelelő ügyfél", empty: "Próbálj más keresést, vagy rögzíts utánkövetési vagy kapcsolatfelvételi dátumot. A hiányzó dátum nem bizonyít inaktivitást.",
    prepare: "Üzenet előkészítése", preview: "Üzenet-előnézet", message: "Üzenet szövege", boundary: "Csak előnézet — nincs elküldve és nincs elmentve az Üzenetek közé. Ellenőrizd, majd másold a szöveget.",
    copy: "Szöveg másolása", copied: "Másolva", copyFailed: "Nem sikerült másolni. Jelöld ki a szöveget, és másold kézzel.", close: "Előnézet bezárása",
    template: name => `Kedves ${name}!\n\nSzeretnék érdeklődni, van-e most valami, amit szívesen megbeszélnél, vagy amiben segítségedre lehetek. Kérlek, jelezz, amikor alkalmas.\n\nÜdvözlettel`,
  },
  de: {
    filter: "Kunden erneut kontaktieren", contact: "Letzter Kontakt", invalidDate: "Wählen Sie ein gültiges Kontaktdatum, das nicht in der Zukunft liegt.", unknown: "Nicht erfasst",
    due: "Nachverfolgung ist fällig", inactive: "Letzter erfasster Kontakt vor mindestens 90 Tagen",
    criteria: "Aktive Kunden mit fälliger Nachverfolgung oder letztem erfassten Kontakt vor mindestens 90 Tagen. Ein zukünftiger Termin verschiebt den Vorschlag.",
    noResults: "Keine passenden Kunden", empty: "Versuchen Sie eine andere Suche oder erfassen Sie ein Kontakt- oder Nachverfolgungsdatum. Fehlende Daten belegen keine Inaktivität.",
    prepare: "Nachricht vorbereiten", preview: "Nachrichtenvorschau", message: "Nachrichtentext", boundary: "Nur Vorschau — nicht gesendet und nicht unter Nachrichten gespeichert. Prüfen und kopieren Sie den Text.",
    copy: "Text kopieren", copied: "Kopiert", copyFailed: "Kopieren nicht möglich. Markieren und kopieren Sie den Text manuell.", close: "Vorschau schließen",
    template: name => `Guten Tag ${name},\n\nich wollte nachfragen, ob Sie etwas besprechen möchten oder Unterstützung benötigen. Melden Sie sich gerne, wenn es Ihnen passt.\n\nMit freundlichen Grüßen`,
  },
  fr: {
    filter: "Recontacter les clients", contact: "Dernier contact", invalidDate: "Choisissez une date de contact valide qui ne soit pas dans le futur.", unknown: "Non renseigné",
    due: "Suivi à effectuer", inactive: "Dernier contact enregistré il y a au moins 90 jours",
    criteria: "Clients actifs avec un suivi à effectuer ou un dernier contact enregistré il y a au moins 90 jours. Un suivi futur reporte cette suggestion.",
    noResults: "Aucun client ne correspond à cette vue", empty: "Essayez une autre recherche ou renseignez une date de suivi ou de contact. Une date manquante ne prouve pas l’inactivité.",
    prepare: "Préparer un message", preview: "Aperçu du message", message: "Texte du message", boundary: "Aperçu uniquement — non envoyé et non enregistré dans Messages. Vérifiez puis copiez le texte.",
    copy: "Copier le texte", copied: "Copié", copyFailed: "Copie impossible. Sélectionnez le texte et copiez-le manuellement.", close: "Fermer l’aperçu",
    template: name => `Bonjour ${name},\n\nje souhaitais prendre de vos nouvelles et savoir si vous souhaitez discuter d’un sujet ou avez besoin d’aide. N’hésitez pas à me répondre quand cela vous convient.\n\nCordialement`,
  },
  es: {
    filter: "Volver a contactar", contact: "Último contacto", invalidDate: "Elige una fecha de contacto válida que no sea futura.", unknown: "Sin registrar",
    due: "Seguimiento pendiente", inactive: "Último contacto registrado hace al menos 90 días",
    criteria: "Clientes activos con seguimiento pendiente o último contacto registrado hace al menos 90 días. Un seguimiento futuro pospone la sugerencia.",
    noResults: "Ningún cliente coincide con esta vista", empty: "Prueba otra búsqueda o registra una fecha de seguimiento o contacto. La falta de fecha no demuestra inactividad.",
    prepare: "Preparar mensaje", preview: "Vista previa del mensaje", message: "Texto del mensaje", boundary: "Solo vista previa — no se ha enviado ni guardado en Mensajes. Revisa y copia el texto.",
    copy: "Copiar texto", copied: "Copiado", copyFailed: "No se pudo copiar. Selecciona el texto y cópialo manualmente.", close: "Cerrar vista previa",
    template: name => `Hola ${name},\n\nquería saber si hay algo que te gustaría comentar o en lo que pueda ayudarte. Avísame cuando te venga bien.\n\nUn saludo`,
  },
}
