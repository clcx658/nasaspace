// Cloudflare Pages Function: /api/donki
// Fetches real space-weather events from NASA's DONKI database and keeps the NASA API key on the server.
// The key comes from the secret NASA_API_KEY (Cloudflare Pages -> Settings -> Variables and Secrets).
// It is never sent to the browser and never included in error messages.
//
//   GET /api/donki?type=FLR&days=30     type: FLR (solar flares) | CME | GST | SEP     days: 1-90
//
// Answers are cached for an hour so the page cannot use up NASA's rate limit (about 1,000 requests/hour per key).

const TYPES = ['FLR', 'CME', 'GST', 'SEP'];
const CLASS_RANK = { A: 1, B: 2, C: 3, M: 4, X: 5 };

const json = (body, status = 200, cache = 'no-store') =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': cache },
  });

// Flare classes look like "M2.1" or "X1.0". Higher letter, then higher number, = stronger.
function flareScore(c) {
  const m = /^([ABCMX])\s*([\d.]+)?/i.exec(String(c || ''));
  if (!m) return 0;
  return (CLASS_RANK[m[1].toUpperCase()] || 0) * 1000 + (parseFloat(m[2]) || 0);
}

function trim(type, data) {
  const list = Array.isArray(data) ? data : [];
  if (type === 'FLR') {
    const items = list
      .map((e) => ({
        id: e.flrID || null,
        classType: e.classType || null,
        beginTime: e.beginTime || null,
        peakTime: e.peakTime || null,
        sourceLocation: e.sourceLocation || null,
        activeRegionNum: e.activeRegionNum || null,
      }))
      .sort((a, b) => String(b.beginTime).localeCompare(String(a.beginTime)));
    let strongest = null;
    for (const f of items) if (!strongest || flareScore(f.classType) > flareScore(strongest.classType)) strongest = f;
    return { count: list.length, strongest, items: items.slice(0, 5) };
  }
  if (type === 'CME') {
    const items = list
      .map((e) => ({ id: e.activityID || null, startTime: e.startTime || null, sourceLocation: e.sourceLocation || null }))
      .sort((a, b) => String(b.startTime).localeCompare(String(a.startTime)));
    return { count: list.length, strongest: null, items: items.slice(0, 5) };
  }
  if (type === 'GST') {
    const items = list.map((e) => {
      const kp = (e.allKpIndex || []).map((k) => Number(k.kpIndex)).filter((n) => !isNaN(n));
      return { id: e.gstID || null, startTime: e.startTime || null, maxKp: kp.length ? Math.max(...kp) : null };
    }).sort((a, b) => String(b.startTime).localeCompare(String(a.startTime)));
    return { count: list.length, strongest: null, items: items.slice(0, 5) };
  }
  const items = list
    .map((e) => ({ id: e.sepID || null, eventTime: e.eventTime || null }))
    .sort((a, b) => String(b.eventTime).localeCompare(String(a.eventTime)));
  return { count: list.length, strongest: null, items: items.slice(0, 5) };
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const type = (url.searchParams.get('type') || 'FLR').toUpperCase();
  let days = parseInt(url.searchParams.get('days') || '30', 10);
  if (!TYPES.includes(type)) return json({ ok: false, reason: 'bad_type' }, 400);
  days = Math.min(Math.max(isNaN(days) ? 30 : days, 1), 90);

  const key = env && env.NASA_API_KEY;
  if (!key) return json({ ok: false, reason: 'no_key' }, 503);

  const cache = typeof caches !== 'undefined' ? caches.default : null;
  const cacheKey = new Request(`${url.origin}/api/donki?type=${type}&days=${days}`);
  if (cache) {
    const hit = await cache.match(cacheKey);
    if (hit) return hit;
  }

  const end = new Date();
  const start = new Date(end.getTime() - days * 86400000);
  const ymd = (d) => d.toISOString().slice(0, 10);
  const api = `https://api.nasa.gov/DONKI/${type}?startDate=${ymd(start)}&endDate=${ymd(end)}&api_key=${encodeURIComponent(key)}`;

  let r;
  try {
    r = await fetch(api);
  } catch (e) {
    return json({ ok: false, reason: 'network' }, 502);
  }
  if (!r.ok) return json({ ok: false, reason: 'upstream_' + r.status }, 502);

  let data;
  try {
    data = await r.json();
  } catch (e) {
    return json({ ok: false, reason: 'bad_response' }, 502);
  }
  const res = json({ ok: true, type, days, fetched: new Date().toISOString(), ...trim(type, data) }, 200, 'public, max-age=3600');
  if (cache && context.waitUntil) context.waitUntil(cache.put(cacheKey, res.clone()));
  return res;
}
