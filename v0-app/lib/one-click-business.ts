export type LaunchBrief={businessName:string;customerName:string;customerEmail:string;offer:string;amount:number;currency:"GBP"|"EUR"|"USD"|"HUF";vatRate:number;dueDate:string}
export type TradePresetId="painter"|"builder"|"cleaner"|"electrician"|"small-shop"
export const TRADE_PRESETS={
  painter:{offer:"Painting and decorating",currency:"GBP",validityDays:14},
  builder:{offer:"Building and masonry work",currency:"GBP",validityDays:14},
  cleaner:{offer:"Cleaning service",currency:"GBP",validityDays:14},
  electrician:{offer:"Electrical work",currency:"GBP",validityDays:14},
  "small-shop":{offer:"Goods and retail service",currency:"GBP",validityDays:14},
} as const satisfies Readonly<Record<TradePresetId,{offer:string;currency:"GBP";validityDays:14}>>
export function applyTradePreset(input:LaunchBrief,presetId:TradePresetId,dueDate:string):LaunchBrief{const preset=TRADE_PRESETS[presetId];if(!preset)return input;return{...input,offer:input.offer.trim()?input.offer:preset.offer,currency:preset.currency,dueDate}}
export function validateLaunchBrief(input:LaunchBrief){const errors:string[]=[];if(input.businessName.trim().length<2)errors.push("businessName");if(input.customerName.trim().length<2)errors.push("customerName");if(input.customerEmail&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.customerEmail))errors.push("customerEmail");if(input.offer.trim().length<3)errors.push("offer");if(!Number.isFinite(input.amount)||input.amount<0)errors.push("amount");if(input.vatRate<0||input.vatRate>100)errors.push("vatRate");if(!/^\d{4}-\d{2}-\d{2}$/.test(input.dueDate))errors.push("dueDate");return{ok:errors.length===0,errors}}
export const launchSource=(id:string,kind:string)=>`one-click:${id}:${kind}`
