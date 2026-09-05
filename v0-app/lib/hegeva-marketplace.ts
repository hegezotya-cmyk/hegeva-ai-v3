export type SkillId="cash-recovery"|"lead-follow-up"|"daily-priorities"|"campaign-builder"|"scenario-planner"
export type Skill={id:SkillId;category:"operate"|"grow"|"decide";route:string;writes:boolean;external:boolean}
export const HEGEVA_SKILLS:Skill[]=[{id:"cash-recovery",category:"operate",route:"/business/intelligence",writes:true,external:false},{id:"lead-follow-up",category:"grow",route:"/business/intelligence",writes:true,external:false},{id:"daily-priorities",category:"operate",route:"/command-center",writes:false,external:false},{id:"campaign-builder",category:"grow",route:"/app-studio/advertising",writes:true,external:false},{id:"scenario-planner",category:"decide",route:"/business/twin",writes:false,external:false}]
export const skillStateId=(id:SkillId)=>`hegeva-skill:${id}`
