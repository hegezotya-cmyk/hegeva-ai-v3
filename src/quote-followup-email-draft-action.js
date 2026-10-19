const SUPPORTED_LOCALES=new Set(["en","hu","de","fr","es"])
const string=(value,maximum=500)=>typeof value==="string"?value.trim().slice(0,maximum):""
const email=(value)=>string(value,200).match(/[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,}/i)?.[0]||""

function copy(locale,{number,customer,business}){
 const messages={
  en:{subject:`Following up on quote ${number}`,body:`Hello ${customer},\n\nI’m following up on quote ${number}. Please let us know if you have any questions or would like to discuss the scope, timing or next steps.\n\nKind regards,\n${business}`},
  hu:{subject:`Érdeklődés a(z) ${number} ajánlatról`,body:`Kedves ${customer}!\n\nSzeretnék érdeklődni a(z) ${number} számú ajánlattal kapcsolatban. Kérem, jelezze, ha kérdése van, vagy szeretné átbeszélni a munkakört, az időzítést vagy a következő lépéseket.\n\nÜdvözlettel,\n${business}`},
  de:{subject:`Nachfrage zum Angebot ${number}`,body:`Guten Tag ${customer},\n\nich möchte bezüglich des Angebots ${number} nachfragen. Bitte melden Sie sich, wenn Sie Fragen haben oder Umfang, Zeitplan oder nächste Schritte besprechen möchten.\n\nMit freundlichen Grüßen\n${business}`},
  fr:{subject:`Suivi du devis ${number}`,body:`Bonjour ${customer},\n\nJe reviens vers vous au sujet du devis ${number}. N’hésitez pas à nous contacter si vous avez des questions ou souhaitez discuter du périmètre, du calendrier ou des prochaines étapes.\n\nCordialement,\n${business}`},
  es:{subject:`Seguimiento del presupuesto ${number}`,body:`Hola ${customer},\n\nMe pongo en contacto para hacer seguimiento del presupuesto ${number}. Avísanos si tienes preguntas o quieres comentar el alcance, los plazos o los próximos pasos.\n\nUn saludo,\n${business}`}
 }
 return messages[SUPPORTED_LOCALES.has(locale)?locale:"en"]
}

export function prepareQuoteFollowUpEmailDraft({quote,customers,messages,locale="en",now=new Date().toISOString()}){
 const quoteId=string(quote?.id,100),number=string(quote?.number,100),dueDate=string(quote?.dueDate,10),customerName=string(quote?.clientName,200),businessName=string(quote?.businessName,200),recipient=email(quote?.clientDetails),today=now.slice(0,10)
 if(!quoteId||quote?.type!=="quote"||quote?.status!=="sent"||!number||!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)||dueDate>=today||!customerName||!businessName||!recipient)return{ok:false,reason:"insufficient-evidence"}
 if(!Array.isArray(customers)||!customers.some(customer=>string(customer?.title,200)===customerName))return{ok:false,reason:"customer-not-authorized"}
 const actionKey=`email-draft:quote-followup:${quoteId}`,existing=Array.isArray(messages)&&messages.find(message=>message?.actionKey===actionKey)
 if(existing)return{ok:true,created:false,draft:existing}
 const wording=copy(locale,{number,customer:customerName,business:businessName})
 const draft={id:crypto.randomUUID(),actionKey,actionType:"email-draft",sourceId:quoteId,type:"Quote follow-up",tone:"Professional",recipient,subject:wording.subject,body:wording.body,createdAt:now,workflowStatus:"draft",approvalState:"awaiting-approval",approvalVersion:0,approvedAt:null,approvedByActorHash:null,deliveryStatus:"not-sent",executionStatus:"not-executed",sent:false,evidence:{quoteNumber:number,dueDate,customerName},audit:[{event:"prepared",actionType:"email-draft",target:recipient,previousState:"prepared",newState:"awaiting-approval",occurredAt:now,deliveryStatus:"not-sent",executionStatus:"not-executed"}]}
 return{ok:true,created:true,draft}
}

