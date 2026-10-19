const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const { Request: BindingRequest } = require('miniflare')
const filename = path.resolve(__dirname, '../app/api/[...path]/route.ts')
// Only the external service boundary is substituted. The production route and
// installed Miniflare Request constructor run unchanged, without network/auth.
function load(source, binding) {
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const mod = { exports: {} }
  vm.runInNewContext(code, { module: mod, exports: mod.exports, Request, Response, Headers, URL, Uint8Array, TextDecoder, console, require(id) {
    if (id === '@opennextjs/cloudflare') return { getCloudflareContext: async () => ({ env: { HEGEVA_API: binding } }) }
    return require(id)
  } }, { filename })
  return mod.exports
}
;(async () => {
  const boundary = { async fetch(input, init) { new BindingRequest(input, init); return new Response('ok') } }
  await assert.rejects(boundary.fetch(new Request('http://localhost/api/transport-regression')), /Failed to parse URL from \[object Request\]/)
  console.log('CONFIRMED: the binding rejects a Request object as input')
  let forwarded, upstream, pulls
  const binding = { async fetch(input, init) {
    const request = new BindingRequest(input, init)
    forwarded = { url: request.url, method: request.method, headers: request.headers, redirect: request.redirect, bytes: Buffer.from(await request.arrayBuffer()) }
    pulls = 0
    const stream = new ReadableStream({ pull(controller) { pulls++; controller.enqueue(new Uint8Array([pulls])); if (pulls === 2) controller.close() } })
    const headers = new Headers({ 'x-upstream': 'retained', 'content-type': 'application/octet-stream' })
    headers.append('set-cookie', 'fixture_a=one; HttpOnly; Secure; Path=/')
    headers.append('set-cookie', 'fixture_b=two; HttpOnly; Secure; Path=/')
    upstream = new Response(stream, { status: 202, statusText: 'Accepted', headers })
    return upstream
  } }
  const route = load(fs.readFileSync(filename, 'utf8'), binding)
  const multipart = '--fixture\r\nContent-Disposition: form-data; name="file"; filename="probe.bin"\r\nContent-Type: application/octet-stream\r\n\r\nDATA\r\n--fixture--\r\n'
  const cases = [
    { method: 'GET' },
    { method: 'POST', body: '{"fixture":"transport-only"}', type: 'application/json' },
    { method: 'PUT', body: new Uint8Array([0,255,128,13,10]), type: 'application/octet-stream' },
    { method: 'POST', body: multipart, type: 'multipart/form-data; boundary=fixture' },
    { method: 'PATCH', body: new ReadableStream({ start(c) { c.enqueue(new Uint8Array([0,255])); c.enqueue(new Uint8Array([3,4])); c.close() } }), duplex: 'half', type: 'application/octet-stream' }
  ]
  for (const fixture of cases) {
    const headers = { cookie: 'synthetic_session=fixture', authorization: 'Bearer synthetic-fixture', 'x-transport-fixture': 'retained', ...(fixture.type ? { 'content-type': fixture.type } : {}) }
    const request = new Request('http://127.0.0.1:3107/api/transport-regression?probe=1&encoded=%2F', { ...fixture, headers })
    const expected = Buffer.from(await request.clone().arrayBuffer())
    const response = await route[fixture.method](request)
    assert.equal(forwarded.url, 'https://hegevaai.co.uk/api/transport-regression?probe=1&encoded=%2F')
    assert.equal(forwarded.method, fixture.method)
    assert.deepEqual(forwarded.bytes, expected)
    assert.equal(forwarded.redirect, 'manual')
    for (const [key,value] of Object.entries(headers)) assert.equal(forwarded.headers.get(key),value)
    assert.equal(forwarded.headers.get('x-forwarded-host'), 'hegevaai.co.uk')
    assert.equal(forwarded.headers.get('x-forwarded-proto'), 'https')
    assert.equal(forwarded.headers.get('content-length'), null)
    assert.equal(response.status, 202)
    assert.equal(response.statusText, 'Accepted')
    assert.equal(response.headers.get('x-upstream'), 'retained')
    assert.deepEqual(response.headers.getSetCookie(), upstream.headers.getSetCookie())
    assert.equal(response.headers.get('cache-control'), 'no-store, max-age=0')
    assert.equal(response.headers.get('pragma'), 'no-cache')
    assert.equal(response.body, upstream.body, 'response stream must be forwarded without buffering')
    assert.equal(upstream.bodyUsed, false)
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), Buffer.from([1,2]))
  }
  console.log('PASS: GET, JSON, binary, multipart and chunked request bytes; credentials, cookies and streaming responses')
})().catch(error => { console.error(error); process.exitCode = 1 })
