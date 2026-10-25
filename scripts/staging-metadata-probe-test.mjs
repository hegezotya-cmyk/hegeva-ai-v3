import assert from 'node:assert/strict'
import { probe } from './staging-metadata-probe.mjs'
const calls=[]
const fake=async (url, options)=>{calls.push({url,options}); return {status:calls.length===3?403:200}}
const results=await probe('a'.repeat(32),'secret',fake)
assert.equal(calls.length,6)
assert.ok(calls.every(c=>c.url.startsWith('https://api.cloudflare.com/client/v4/accounts/') && c.options.method==='GET' && c.options.redirect==='error'))
assert.ok(calls.every(c=>c.url.includes('hegeva-ai-v3-staging')))
assert.equal(results[2].status,403)
assert.ok(!JSON.stringify(results).includes('secret'))
await assert.rejects(()=>probe('invalid','secret',fake))
console.log('metadata probe tests PASS')
