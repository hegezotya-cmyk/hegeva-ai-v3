function londonMonthStart(now) {
  const calendar = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/London', year: 'numeric', month: '2-digit', timeZoneName: 'longOffset'
  }).formatToParts(now);
  const value = key => calendar.find(part => part.type === key)?.value || '';
  const year = Number(value('year'));
  const month = Number(value('month'));
  const offset = value('timeZoneName').match(/^GMT([+-])(\d{2}):(\d{2})$/);
  const offsetMs = offset ? (offset[1] === '-' ? -1 : 1) * (Number(offset[2]) * 60 + Number(offset[3])) * 60_000 : 0;
  return new Date(Date.UTC(year, month - 1, 1) - offsetMs).toISOString();
}

const count = value => Number.isFinite(Number(value)) ? Number(value) : 0;

const isOwner = (env, user) => {
  const ownerEmail = typeof env.ADMIN_EMAIL === 'string' ? env.ADMIN_EMAIL.trim().toLowerCase() : '';
  return Boolean(ownerEmail && user?.email && user.email.trim().toLowerCase() === ownerEmail);
};

export async function readOwnerAccess(request, env, user) {
  const headers = { 'Cache-Control': 'private, no-store' };
  if (request.method !== 'GET') return Response.json({ error: 'Method not allowed.' }, { status: 405, headers });
  if (!isOwner(env, user)) return Response.json({ error: 'Owner access required.' }, { status: 403, headers });
  return Response.json({ owner: true }, { headers });
}

export async function listOwnerRegistrations(request, env, user) {
  const headers = { 'Cache-Control': 'private, no-store' };
  if (request.method !== 'GET') return Response.json({ error: 'Method not allowed.' }, { status: 405, headers });
  if (!isOwner(env, user)) {
    return Response.json({ error: 'Owner access required.' }, { status: 403, headers });
  }
  const offset = Number(new URL(request.url).searchParams.get('offset') || '0');
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > 1000000) {
    return Response.json({ error: 'Invalid page.' }, { status: 400, headers });
  }
  try {
    const generatedAt = new Date();
    const sevenDaysAgo = new Date(generatedAt.getTime() - 7 * 86_400_000);
    const thirtyDaysAgo = new Date(generatedAt.getTime() - 30 * 86_400_000);
    const currentMonthStart = londonMonthStart(generatedAt);
    const metricRow = await env.DB.prepare(`
      SELECT
        (SELECT COUNT(*) FROM "user") AS registrationTotal,
        (SELECT COUNT(*) FROM "user" WHERE emailVerified = 1) AS registrationVerified,
        (SELECT COUNT(*) FROM "user" WHERE CASE
          WHEN typeof(createdAt) IN ('integer', 'real') THEN createdAt >= ?1
          WHEN CAST(createdAt AS TEXT) GLOB '[0-9]*' AND CAST(createdAt AS TEXT) NOT GLOB '*[^0-9]*' THEN CAST(createdAt AS INTEGER) >= ?1
          ELSE createdAt >= ?2 END) AS registrations7d,
        (SELECT COUNT(*) FROM "user" WHERE CASE
          WHEN typeof(createdAt) IN ('integer', 'real') THEN createdAt >= ?3
          WHEN CAST(createdAt AS TEXT) GLOB '[0-9]*' AND CAST(createdAt AS TEXT) NOT GLOB '*[^0-9]*' THEN CAST(createdAt AS INTEGER) >= ?3
          ELSE createdAt >= ?4 END) AS registrations30d,
        (SELECT COUNT(DISTINCT userId) FROM workspace_data) AS workspaceUsers,
        (SELECT COUNT(DISTINCT userId) FROM workspace_data WHERE updatedAt >= ?5) AS workspaceActive7d,
        (SELECT COUNT(DISTINCT userId) FROM workspace_data WHERE updatedAt >= ?6) AS workspaceActive30d,
        (SELECT COUNT(DISTINCT userId) FROM workspace_data WHERE dataType IN ('customers', 'invoice_documents', 'planner', 'messages') AND json_valid(data) AND json_type(data) = 'array' AND json_array_length(data) > 0) AS firstValueUsers,
        (SELECT COUNT(DISTINCT userId) FROM workspace_data WHERE dataType = 'customers' AND json_valid(data) AND json_type(data) = 'array' AND json_array_length(data) > 0) AS customerUsers,
        (SELECT COUNT(DISTINCT workspace_data.userId) FROM workspace_data, json_each(CASE WHEN json_valid(data) THEN data ELSE '[]' END) item WHERE dataType = 'invoice_documents' AND json_extract(item.value, '$.type') = 'quote') AS quoteUsers,
        (SELECT COUNT(DISTINCT workspace_data.userId) FROM workspace_data, json_each(CASE WHEN json_valid(data) THEN data ELSE '[]' END) item WHERE dataType = 'invoice_documents' AND json_extract(item.value, '$.type') = 'invoice') AS invoiceUsers,
        (SELECT COUNT(DISTINCT userId) FROM workspace_data WHERE dataType = 'planner' AND json_valid(data) AND json_type(data) = 'array' AND json_array_length(data) > 0) AS plannerUsers,
        (SELECT COUNT(DISTINCT userId) FROM workspace_data WHERE dataType = 'messages' AND json_valid(data) AND json_type(data) = 'array' AND json_array_length(data) > 0) AS messageUsers,
        (SELECT COUNT(*) FROM assistant_usage_settlements WHERE createdAt >= ?7) AS assistantOperationsMonth,
        (SELECT COUNT(*) FROM assistant_usage_settlements WHERE createdAt >= ?7 AND outcome = 'success') AS assistantSuccessMonth,
        (SELECT COUNT(*) FROM assistant_usage_settlements WHERE createdAt >= ?7 AND outcome = 'failure') AS assistantFailureMonth,
        (SELECT COUNT(*) FROM assistant_usage_settlements WHERE createdAt >= ?7 AND outcome = 'timeout') AS assistantTimeoutMonth,
        (SELECT COUNT(DISTINCT userId) FROM assistant_usage_settlements WHERE createdAt >= ?7) AS assistantActiveUsersMonth,
        (SELECT ROUND(AVG(elapsedMs)) FROM assistant_usage_settlements WHERE createdAt >= ?7 AND outcome = 'success') AS assistantAverageResponseMs,
        (SELECT COUNT(*) FROM stripe_customers WHERE subscriptionStatus = 'active') AS subscriptionActive,
        (SELECT COUNT(*) FROM stripe_customers WHERE subscriptionStatus = 'trialing') AS subscriptionTrialing,
        (SELECT COUNT(*) FROM stripe_customers WHERE subscriptionStatus = 'past_due') AS subscriptionPastDue
    `).bind(sevenDaysAgo.getTime(), sevenDaysAgo.toISOString(), thirtyDaysAgo.getTime(), thirtyDaysAgo.toISOString(), sevenDaysAgo.toISOString(), thirtyDaysAgo.toISOString(), currentMonthStart).first();
    const result = await env.DB.prepare(`SELECT id, name, email, emailVerified, createdAt FROM "user" ORDER BY createdAt DESC, id DESC LIMIT ?1 OFFSET ?2`).bind(51, offset).all();
    const rows = Array.isArray(result?.results) ? result.results : [];
    const users = rows.slice(0, 50).map(row => ({ id: row.id, name: row.name, email: row.email, emailVerified: row.emailVerified === true || row.emailVerified === 1, createdAt: row.createdAt }));
    const metrics = {
      generatedAt: generatedAt.toISOString(),
      windows: { timeZone: 'Europe/London', currentMonthStart },
      registrations: {
        total: count(metricRow?.registrationTotal), verified: count(metricRow?.registrationVerified),
        last7Days: count(metricRow?.registrations7d), last30Days: count(metricRow?.registrations30d),
      },
      activation: {
        workspaceUsers: count(metricRow?.workspaceUsers), active7Days: count(metricRow?.workspaceActive7d),
        active30Days: count(metricRow?.workspaceActive30d),
        firstValueUsers: count(metricRow?.firstValueUsers), customerUsers: count(metricRow?.customerUsers),
        quoteUsers: count(metricRow?.quoteUsers), invoiceUsers: count(metricRow?.invoiceUsers),
        plannerUsers: count(metricRow?.plannerUsers), messageUsers: count(metricRow?.messageUsers),
      },
      assistant: {
        operationsThisMonth: count(metricRow?.assistantOperationsMonth), successfulThisMonth: count(metricRow?.assistantSuccessMonth),
        failedThisMonth: count(metricRow?.assistantFailureMonth), timedOutThisMonth: count(metricRow?.assistantTimeoutMonth),
        activeUsersThisMonth: count(metricRow?.assistantActiveUsersMonth),
        averageResponseMs: metricRow?.assistantAverageResponseMs == null ? null : count(metricRow.assistantAverageResponseMs),
      },
      subscriptions: {
        active: count(metricRow?.subscriptionActive), trialing: count(metricRow?.subscriptionTrialing), pastDue: count(metricRow?.subscriptionPastDue),
      },
    };
    return Response.json({ users, nextOffset: rows.length > 50 ? offset + 50 : null, metrics }, { headers });
  } catch {
    return Response.json({ error: 'Registrations are temporarily unavailable.' }, { status: 503, headers });
  }
}
