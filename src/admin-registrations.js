export async function listOwnerRegistrations(request, env, user) {
  const headers = { 'Cache-Control': 'private, no-store' };
  if (request.method !== 'GET') return Response.json({ error: 'Method not allowed.' }, { status: 405, headers });
  const ownerEmail = typeof env.ADMIN_EMAIL === 'string' ? env.ADMIN_EMAIL.trim().toLowerCase() : '';
  if (!ownerEmail || !user?.email || user.email.trim().toLowerCase() !== ownerEmail) {
    return Response.json({ error: 'Owner access required.' }, { status: 403, headers });
  }
  const offset = Number(new URL(request.url).searchParams.get('offset') || '0');
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > 1000000) {
    return Response.json({ error: 'Invalid page.' }, { status: 400, headers });
  }
  try {
    const result = await env.DB.prepare(`SELECT id, name, email, emailVerified, createdAt FROM "user" ORDER BY createdAt DESC, id DESC LIMIT ?1 OFFSET ?2`).bind(51, offset).all();
    const rows = Array.isArray(result?.results) ? result.results : [];
    const users = rows.slice(0, 50).map(row => ({ id: row.id, name: row.name, email: row.email, emailVerified: row.emailVerified === true || row.emailVerified === 1, createdAt: row.createdAt }));
    return Response.json({ users, nextOffset: rows.length > 50 ? offset + 50 : null }, { headers });
  } catch {
    return Response.json({ error: 'Registrations are temporarily unavailable.' }, { status: 503, headers });
  }
}
