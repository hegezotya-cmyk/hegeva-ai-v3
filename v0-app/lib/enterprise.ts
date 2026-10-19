export const ENTERPRISE_ROLES = ["owner", "admin", "editor", "viewer"] as const
export type EnterpriseRole = (typeof ENTERPRISE_ROLES)[number]
export const ENTERPRISE_INVITATION_STATES = ["pending", "accepted", "revoked", "expired"] as const
export type EnterpriseInvitationState = (typeof ENTERPRISE_INVITATION_STATES)[number]
export type EnterprisePermission = "manage-organization"|"manage-members"|"manage-workspaces"|"approve-changes"|"view-reports"|"export-compliance"|"manage-settings"
export const ENTERPRISE_PERMISSIONS: Record<EnterpriseRole, readonly EnterprisePermission[]> = {
  owner:["manage-organization","manage-members","manage-workspaces","approve-changes","view-reports","export-compliance","manage-settings"],
  admin:["manage-members","manage-workspaces","approve-changes","view-reports","export-compliance","manage-settings"],
  editor:["view-reports"], viewer:["view-reports"],
}
export type EnterpriseTeam = { id:string; name:string; department:string; memberCount:number }
export type EnterpriseMember = { id:string; displayName:string; role:EnterpriseRole; workspaceId:string; status:"active"|"invited" }
export type EnterpriseInvitation = { id:string; email:string; workspaceId:string; role:EnterpriseRole; state:EnterpriseInvitationState }
export type EnterpriseAuditEvent = { id:string; action:string; occurredAt:string; actorRole:EnterpriseRole }
export type EnterpriseWorkspace = { id:string; name:string; department:string; role:EnterpriseRole; status:"active"|"invitation-pending"; teamIds?:string[] }
export type EnterpriseRecord = { id:string; organizationName:string; workspaces:EnterpriseWorkspace[]; approvalRequired:true; ssoStatus:"unavailable"; teams?:EnterpriseTeam[]; members?:EnterpriseMember[]; invitations?:EnterpriseInvitation[]; auditEvents?:EnterpriseAuditEvent[]; settings?:{retentionDays:number; slaTier:"standard"|"priority"}; apiKeyCount?:number; webhookCount?:number }
export const ENTERPRISE_DEFAULTS:EnterpriseRecord={id:"enterprise-local-organization",organizationName:"",workspaces:[],approvalRequired:true,ssoStatus:"unavailable"}
export const ENTERPRISE_LIMITS={organizationName:80,workspaceName:64,department:64,teamName:64,maxTeams:24,maxMembers:500,maxInvitations:500} as const
export function validateEnterprise(record:EnterpriseRecord):boolean { if(!record||typeof record!=="object"||typeof record.organizationName!=="string"||record.organizationName.length>80||!Array.isArray(record.workspaces)||record.workspaces.length>24||record.approvalRequired!==true||record.ssoStatus!=="unavailable") return false; const ids=new Set<string>(); if(!record.workspaces.every(w=>{if(!w||typeof w.id!=="string"||ids.has(w.id)||typeof w.name!=="string"||typeof w.department!=="string") return false; ids.add(w.id); return w.name.length<=64&&w.department.length<=64&&ENTERPRISE_ROLES.includes(w.role)&&["active","invitation-pending"].includes(w.status)})) return false; if(record.teams&&!record.teams.every(t=>typeof t.id==="string"&&typeof t.name==="string"&&t.name.length<=64&&typeof t.department==="string"&&t.department.length<=64&&Number.isInteger(t.memberCount)&&t.memberCount>=0)) return false; if(record.invitations&&!record.invitations.every(i=>typeof i.id==="string"&&typeof i.email==="string"&&i.email.length<=160&&typeof i.workspaceId==="string"&&ENTERPRISE_ROLES.includes(i.role)&&ENTERPRISE_INVITATION_STATES.includes(i.state))) return false; return true }
export function permissionFor(role:EnterpriseRole, permission:EnterprisePermission){ return ENTERPRISE_PERMISSIONS[role].includes(permission) }
export function appendEnterpriseAudit(record:EnterpriseRecord, action:string, actorRole:EnterpriseRole):EnterpriseRecord { const event={id:`audit-${(record.auditEvents?.length||0)+1}`,action:action.slice(0,80),occurredAt:new Date().toISOString(),actorRole}; return {...record,auditEvents:[...(record.auditEvents||[]),event]} }
export function exportEnterpriseCompliance(record:EnterpriseRecord){ return {organizationConfigured:Boolean(record.organizationName),workspaceCount:record.workspaces.length,teamCount:record.teams?.length||0,memberCount:record.members?.length||0,auditEventCount:record.auditEvents?.length||0,ssoStatus:record.ssoStatus,rawSecretsIncluded:false} }
