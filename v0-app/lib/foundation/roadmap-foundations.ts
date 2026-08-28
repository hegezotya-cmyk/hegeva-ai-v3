export type PulseContext = { userId:string; workspaceId:string; projectId?:string; lastArtifactId?:string; approvedMemoryIds:readonly string[]; currentGoal?:string }
export type PulseBrief = { understood:string; continuity:readonly string[]; needsUser?:string; nextActions:readonly string[] }
export function createPulseBrief(context:PulseContext):PulseBrief{return{understood:context.currentGoal?.trim()||"No active goal has been selected.",continuity:[context.projectId&&"Project context available",context.lastArtifactId&&"Previous artifact available",context.approvedMemoryIds.length&&`${context.approvedMemoryIds.length} approved memories available`].filter(Boolean) as string[],needsUser:context.currentGoal?undefined:"Choose the work you want to continue.",nextActions:context.currentGoal?["Review current state","Continue the next verified step"]:["Open a workspace","Start a mission"]}}

export interface CompanionProfile { name:"HEGEVA"; role:"working-partner"; tone:"clear"|"calm"|"direct"; initiative:"suggest"|"ask-first"; mayImpersonateHuman:false; mayInferEmotion:false }
export const DEFAULT_COMPANION:CompanionProfile={name:"HEGEVA",role:"working-partner",tone:"clear",initiative:"suggest",mayImpersonateHuman:false,mayInferEmotion:false}

export type MissionRuntimeState="draft"|"awaiting-approval"|"ready"|"executing"|"verifying"|"completed"|"failed"|"cancelled"
export interface MissionRuntime { id:string; ownerUserId:string; workspaceId:string; goal:string; state:MissionRuntimeState; approval:"pending"|"approved"|"rejected"; artifactIds:readonly string[]; safeSummary:string }
export function nextMissionState(mission:MissionRuntime,next:MissionRuntimeState):MissionRuntime{const allowed:Record<MissionRuntimeState,readonly MissionRuntimeState[]>={draft:["awaiting-approval","cancelled"],"awaiting-approval":["ready","cancelled"],ready:["executing","cancelled"],executing:["verifying","failed","cancelled"],verifying:["completed","failed"],completed:[],failed:["ready","cancelled"],cancelled:[]};if(!allowed[mission.state].includes(next))throw new Error("mission-transition-denied");if(["ready","executing"].includes(next)&&mission.approval!=="approved")throw new Error("mission-approval-required");return{...mission,state:next,safeSummary:`Mission ${next}`}}

export type TeamRole="planner"|"builder"|"reviewer"|"researcher"
export interface DigitalTeammate { id:string; role:TeamRole; capabilities:readonly string[]; authority:"propose-only"|"bounded-job" }
export interface TeamHandoff { from:string; to:string; missionId:string; artifactIds:readonly string[]; safeSummary:string; requiresApproval:boolean }
export function validateTeamHandoff(handoff:TeamHandoff,team:readonly DigitalTeammate[]){if(!team.some(member=>member.id===handoff.from)||!team.some(member=>member.id===handoff.to))throw new Error("team-member-missing");if(!handoff.safeSummary.trim())throw new Error("handoff-summary-required");return true}

export interface CreativeBrief { brandKitId:string; workspaceId:string; purpose:string; audience:string; channel:"web"|"image"|"video"|"audio"|"advertising"; approval:"pending"|"approved"|"rejected" }
export function authorizeCreativeJob(brief:CreativeBrief){if(!brief.purpose.trim()||!brief.audience.trim())throw new Error("creative-brief-incomplete");if(brief.approval!=="approved")throw new Error("creative-approval-required");return true}

export interface GrowthExperiment { id:string; workspaceId:string; hypothesis:string; metric:string; baseline?:number; target?:number; source:string; approval:"pending"|"approved"|"rejected" }
export function validateGrowthExperiment(experiment:GrowthExperiment){if(!experiment.hypothesis.trim()||!experiment.metric.trim()||!experiment.source.trim())throw new Error("growth-evidence-required");if(experiment.approval!=="approved")throw new Error("growth-approval-required");return true}

export interface OHLCV { symbol:string; at:string; open:number; high:number; low:number; close:number; volume:number; source:string }
export interface MarketConnector { mode:"historical"|"paper"; provider:string; readCandles(symbol:string,from:string,to:string):Promise<readonly OHLCV[]> }
export interface PaperOrder { id:string; symbol:string; side:"buy"|"sell"; quantity:number; mode:"paper"; maxLoss:number; approval:"approved" }
export function validateCandle(candle:OHLCV){return candle.low<=Math.min(candle.open,candle.close)&&candle.high>=Math.max(candle.open,candle.close)&&candle.volume>=0&&Boolean(candle.source)}
export function validatePaperOrder(order:PaperOrder){if(order.mode!=="paper")throw new Error("real-trading-prohibited");if(order.quantity<=0||order.maxLoss<=0)throw new Error("risk-limits-required");return true}

export type WatchtowerSignal={id:string;workspaceId:string;kind:"regression"|"security"|"usage"|"quality";severity:"info"|"warning"|"critical";evidence:readonly string[]; recommendation:string; autoAction:"none"}
export function validateWatchtowerSignal(signal:WatchtowerSignal){if(!signal.evidence.length||!signal.recommendation.trim())throw new Error("watchtower-evidence-required");if(signal.autoAction!=="none")throw new Error("watchtower-auto-action-denied");return true}
