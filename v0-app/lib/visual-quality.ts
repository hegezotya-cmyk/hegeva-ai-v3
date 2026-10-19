export type VisualQualityFinding = { id:string; severity:"high"|"medium"|"low"; message:string; remediation:string }
export function evaluateVisualQuality(input:{cardCount:number; repeatedLayouts:number; maxRadiusCount:number; hasHierarchy:boolean; hasMobileRules:boolean; hasFocusStyles:boolean; semanticAccentCount:number; hasFocalPoint?:boolean; hasPrimaryAction?:boolean; typographyLevels?:number; overflowRisk?:boolean}):VisualQualityFinding[]{
 const findings:VisualQualityFinding[]=[]
 if(input.cardCount>12) findings.push({id:"card-soup",severity:"high",message:"Too many equivalent card surfaces flatten hierarchy.",remediation:"Group related content into one operating surface with internal rows."})
 if(input.repeatedLayouts>3) findings.push({id:"repetition",severity:"medium",message:"Repeated grid composition feels templated.",remediation:"Introduce workflow-led and asymmetric composition."})
 if(input.maxRadiusCount>10) findings.push({id:"radius",severity:"medium",message:"Excessive large radii weaken information structure.",remediation:"Reserve large radii for primary surfaces; use lines and rows inside."})
 if(!input.hasHierarchy) findings.push({id:"hierarchy",severity:"high",message:"Primary action and current state are unclear.",remediation:"Establish one dominant command or workflow region."})
 if(!input.hasMobileRules) findings.push({id:"mobile",severity:"high",message:"No deliberate narrow-screen behavior detected.",remediation:"Define mobile navigation, stacking and overflow rules."})
 if(!input.hasFocusStyles) findings.push({id:"focus",severity:"high",message:"Keyboard focus treatment is missing.",remediation:"Add visible focus styles for every interactive control."})
 if(input.semanticAccentCount>4) findings.push({id:"color-noise",severity:"low",message:"Too many simultaneous accent families dilute meaning.",remediation:"Use one dominant and one supporting semantic accent per view."})
 if(input.hasFocalPoint===false) findings.push({id:"focal-point",severity:"high",message:"The interface has no dominant visual or workflow focal point.",remediation:"Create one primary working region and subordinate supporting information."})
 if(input.hasPrimaryAction===false) findings.push({id:"cta",severity:"high",message:"The next meaningful action is unclear.",remediation:"Promote one real primary action and reduce competing controls."})
 if(typeof input.typographyLevels==="number"&&input.typographyLevels<3) findings.push({id:"typography",severity:"medium",message:"Typography does not establish enough hierarchy.",remediation:"Separate display, section, body and metadata roles."})
 if(input.overflowRisk) findings.push({id:"overflow",severity:"high",message:"Content may exceed the narrow viewport.",remediation:"Constrain intrinsic widths and add responsive overflow handling."})
 return findings
}
