import assert from "node:assert/strict"
import fs from "node:fs"
import ts from "typescript"
const source=fs.readFileSync(new URL("../lib/foundation/roadmap-foundations.ts",import.meta.url),"utf8")
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
const f=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`)
const pulse=f.createPulseBrief({userId:"u",workspaceId:"w",projectId:"p",currentGoal:"Continue PawFlow"});assert.equal(pulse.needsUser,undefined);assert.equal(pulse.continuity.length,1)
assert.equal(f.DEFAULT_COMPANION.mayImpersonateHuman,false);assert.equal(f.DEFAULT_COMPANION.mayInferEmotion,false)
let mission={id:"m",ownerUserId:"u",workspaceId:"w",goal:"Build",state:"draft",approval:"pending",artifactIds:[],safeSummary:"Draft"};mission=f.nextMissionState(mission,"awaiting-approval");assert.throws(()=>f.nextMissionState(mission,"ready"),/mission-approval-required/);mission=f.nextMissionState({...mission,approval:"approved"},"ready");assert.equal(mission.state,"ready")
assert(f.validateTeamHandoff({from:"a",to:"b",missionId:"m",artifactIds:[],safeSummary:"Review specification",requiresApproval:true},[{id:"a",role:"planner",capabilities:[],authority:"propose-only"},{id:"b",role:"reviewer",capabilities:[],authority:"bounded-job"}]))
assert.throws(()=>f.authorizeCreativeJob({brandKitId:"b",workspaceId:"w",purpose:"Campaign",audience:"Owners",channel:"web",approval:"pending"}),/approval/)
assert.throws(()=>f.validateGrowthExperiment({id:"g",workspaceId:"w",hypothesis:"Test",metric:"conversion",source:"",approval:"approved"}),/evidence/)
assert(f.validateCandle({symbol:"TEST",at:"2026-01-01",open:10,high:12,low:9,close:11,volume:20,source:"fixture"}));assert(f.validatePaperOrder({id:"o",symbol:"TEST",side:"buy",quantity:1,mode:"paper",maxLoss:5,approval:"approved"}))
assert(f.validateWatchtowerSignal({id:"s",workspaceId:"w",kind:"quality",severity:"warning",evidence:["test failed"],recommendation:"Review locally",autoAction:"none"}))
console.log("Roadmap foundations audit passed: Pulse continuity, Companion boundaries, approved Missions, bounded teams, Creative/Growth approval, paper-only Markets and evidence-only Watchtower")
