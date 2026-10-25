import assert from 'node:assert/strict'
import { portalDiagnostic } from '../lib/client-portal-diagnostic.ts'
const logs=[]
portalDiagnostic('staging', 'origin', {host:'staging.hegevaai.co.uk', status:200, correlationId:'123e4567-e89b-42d3-a456-426614174000'}, x=>logs.push(x))
portalDiagnostic('production', 'origin', {host:'secret.example', status:200}, x=>logs.push(x))
assert.deepEqual(logs,[{event:'portal_diagnostic',phase:'origin',host:'staging',status:200,correlationId:'123e4567-e89b-42d3-a456-426614174000'}])
portalDiagnostic('staging','fetch',{host:'secret.example',status:404},x=>logs.push(x))
assert.deepEqual(logs[1],{event:'portal_diagnostic',phase:'fetch',host:'other',status:404})
portalDiagnostic('staging','json',{host:null,correlationId:'sensitive-token'},x=>logs.push(x))
assert.equal('correlationId' in logs[2],false)
console.log('Portal diagnostic privacy: PASS')
