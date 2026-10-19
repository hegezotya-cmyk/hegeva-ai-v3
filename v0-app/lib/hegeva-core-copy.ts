export const growthSignalCopy={
 en:{customer:(count:number)=>`${count} customer follow-up${count===1?" is":"s are"} due.`,quote:(count:number)=>`${count} quote${count===1?" has":"s have"} passed its follow-up date.`,draft:(count:number)=>`${count} invoice draft${count===1?" is":"s are"} ready for review.`,customerAction:"Open customer follow-ups",quoteAction:"Follow up quotes",draftAction:"Review invoice drafts",also:"Also detected from your records"},
 hu:{customer:(count:number)=>`${count} ügyfél-utánkövetés esedékes.`,quote:(count:number)=>`${count} ajánlat utánkövetési ideje lejárt.`,draft:(count:number)=>`${count} számlavázlat vár ellenőrzésre.`,customerAction:"Ügyfél-utánkövetések megnyitása",quoteAction:"Ajánlatok utánkövetése",draftAction:"Számlavázlatok ellenőrzése",also:"További észlelések a saját adataidból"},
 de:{customer:(count:number)=>`${count} Kundennachfassung${count===1?" ist":"en sind"} fällig.`,quote:(count:number)=>`${count} Angebot${count===1?" hat":"e haben"} das Nachfassdatum überschritten.`,draft:(count:number)=>`${count} Rechnungsentwurf${count===1?" ist":"e sind"} prüfbereit.`,customerAction:"Kundennachfassungen öffnen",quoteAction:"Angebote nachfassen",draftAction:"Rechnungsentwürfe prüfen",also:"Weitere Signale aus Ihren Daten"},
 fr:{customer:(count:number)=>`${count} suivi${count===1?" client est":"s clients sont"} dû.`,quote:(count:number)=>`${count} devis ${count===1?"a":"ont"} dépassé la date de suivi.`,draft:(count:number)=>`${count} brouillon${count===1?" de facture est":"s de facture sont"} à vérifier.`,customerAction:"Ouvrir les suivis clients",quoteAction:"Relancer les devis",draftAction:"Vérifier les brouillons",also:"Autres signaux issus de vos données"},
 es:{customer:(count:number)=>`${count} seguimiento${count===1?" de cliente está":"s de clientes están"} pendiente.`,quote:(count:number)=>`${count} presupuesto${count===1?" ha":"s han"} superado su fecha de seguimiento.`,draft:(count:number)=>`${count} borrador${count===1?" de factura está":"es de factura están"} listo para revisar.`,customerAction:"Abrir seguimientos",quoteAction:"Dar seguimiento a presupuestos",draftAction:"Revisar borradores",also:"Otras señales de tus datos"},
} as const

export const overdueTaskCopy={
 en:{text:(count:number)=>`${count} overdue task${count===1?" needs":"s need"} attention.`,action:"Resolve overdue tasks"},
 hu:{text:(count:number)=>`${count} lejárt feladat igényel figyelmet.`,action:"Lejárt feladatok rendezése"},
 de:{text:(count:number)=>`${count} überfällige Aufgabe${count===1?" erfordert":"n erfordern"} Aufmerksamkeit.`,action:"Überfällige Aufgaben klären"},
 fr:{text:(count:number)=>`${count} tâche${count===1?" en retard nécessite":"s en retard nécessitent"} votre attention.`,action:"Traiter les tâches en retard"},
 es:{text:(count:number)=>`${count} tarea${count===1?" vencida requiere":"s vencidas requieren"} atención.`,action:"Resolver tareas vencidas"},
} as const
