export type NetworkRelation={id:string;fromId:string;toId:string;kind:"referral"|"partner"|"supplier"|"influencer";note:string;createdAt:string}
export function validRelation(relation:Omit<NetworkRelation,"id"|"createdAt">){return Boolean(relation.fromId&&relation.toId&&relation.fromId!==relation.toId&&relation.note.trim().length<=500)}
export const relationKey=(a:string,b:string,kind:string)=>[a,b].sort().join(":")+`:${kind}`
