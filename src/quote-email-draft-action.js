const SUPPORTED_LOCALES = new Set(["en","hu","de","fr","es"]);
const string=(value,maximum=500)=>typeof value==="string"?value.trim().slice(0,maximum):"";
const email=(value)=>string(value,500).match(/[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,}/i)?.[0]||"";

function copy(locale,{number,customer,business}) {
  const messages={
    en:{subject:`Quote ${number} from ${business}`,body:`Hello ${customer},\n\nPlease find quote ${number} prepared for your review. Please review the scope, pricing and terms and let us know if you have any questions.\n\nKind regards,\n${business}`},
    hu:{subject:`${number} ajánlat – ${business}`,body:`Kedves ${customer}!\n\nElkészítettük a(z) ${number} számú ajánlatot áttekintésre. Kérjük, ellenőrizze a munkakört, az árakat és a feltételeket, és jelezze, ha kérdése van.\n\nÜdvözlettel,\n${business}`},
    de:{subject:`Angebot ${number} von ${business}`,body:`Guten Tag ${customer},\n\nAngebot ${number} wurde für Ihre Prüfung vorbereitet. Bitte prüfen Sie Umfang, Preise und Bedingungen und melden Sie sich bei Fragen.\n\nMit freundlichen Grüßen\n${business}`},
    fr:{subject:`Devis ${number} de ${business}`,body:`Bonjour ${customer},\n\nLe devis ${number} a été préparé pour votre examen. Merci de vérifier le périmètre, les prix et les conditions et de nous contacter si vous avez des questions.\n\nCordialement,\n${business}`},
    es:{subject:`Presupuesto ${number} de ${business}`,body:`Hola ${customer},\n\nEl presupuesto ${number} ha sido preparado para tu revisión. Revisa el alcance, los precios y las condiciones y avísanos si tienes alguna pregunta.\n\nUn saludo,\n${business}`}
  }; return messages[SUPPORTED_LOCALES.has(locale)?locale:"en"];
}

export function prepareQuoteEmailDraft({quote,customers,messages,locale="en",now=new Date().toISOString()}) {
  const quoteId=string(quote?.id,100), number=string(quote?.number,100), customerName=string(quote?.clientName,200), businessName=string(quote?.businessName,200), recipient=email(quote?.clientDetails);
  if(!quoteId||quote?.type!=="quote"||quote?.status!=="draft"||!number||!customerName||!businessName||!recipient) return {ok:false,reason:"insufficient-evidence"};
  if(!Array.isArray(customers)||!customers.some(c=>string(c?.title,200)===customerName)) return {ok:false,reason:"customer-not-authorized"};
  const actionKey=`email-draft:quote:${quoteId}`; const existing=Array.isArray(messages)&&messages.find(m=>m?.actionKey===actionKey);
  if(existing) return {ok:true,created:false,draft:existing};
  const wording=copy(locale,{number,customer:customerName,business:businessName});
  const draft={id:crypto.randomUUID(),actionKey,actionType:"email-draft",sourceId:quoteId,type:"Quote",tone:"Professional",recipient,subject:wording.subject,body:wording.body,createdAt:now,workflowStatus:"draft",approvalState:"awaiting-approval",approvalVersion:0,approvedAt:null,approvedByActorHash:null,deliveryStatus:"not-sent",executionStatus:"not-executed",sent:false,evidence:{quoteNumber:number,customerName},audit:[{event:"prepared",actionType:"email-draft",target:recipient,previousState:"prepared",newState:"awaiting-approval",occurredAt:now,deliveryStatus:"not-sent",executionStatus:"not-executed"}]};
  return {ok:true,created:true,draft};
}
