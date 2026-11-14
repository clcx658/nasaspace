// Cloudflare Pages Function: /api/donki
// Fetches real space-weather events from NASA's DONKI database and keeps the NASA API key on the server.
// The key comes from the secret NASA_API_KEY (Cloudflare Pages -> Settings -> Variables and Secrets).
// The key is optional: if it is missing or NASA's keyed gateway fails, NASA's direct DONKI web service is used instead,
// and for flares NOAA's Space Weather Prediction Center (GOES satellites) is the last backup. The answer says which source was used.
// It is never sent to the browser and never included in error messages.
//
//   GET /api/donki?type=FLR&days=30     type: FLR (solar flares) | CME | GST | SEP     days: 1-90
//   add &debug=1 to see what NASA answered (the key is hidden in the output)
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

  const key = (env && env.NASA_API_KEY) || '';

  const cache = typeof caches !== 'undefined' ? caches.default : null;
  const cacheKey = new Request(`${url.origin}/api/donki?type=${type}&days=${days}`);
  if (cache && url.searchParams.get('debug') !== '1') {
    const hit = await cache.match(cacheKey);
    if (hit) return hit;
  }

  const end = new Date();
  const start = new Date(end.getTime() - days * 86400000);
  const ymd = (d) => d.toISOString().slice(0, 10);
  const range = `startDate=${ymd(start)}&endDate=${ymd(end)}`;
  // Sources, in order: 1) NASA's keyed API gateway, 2) NASA's direct DONKI web service (no key needed),
  // 3) NOAA's Space Weather Prediction Center (real GOES-satellite flare records, last 7 days, flares only).
  const sources = [];
  if (key) sources.push({ name: 'api.nasa.gov', label: 'DONKI', url: `https://api.nasa.gov/DONKI/${type}?${range}&api_key=${encodeURIComponent(key)}` });
  sources.push({ name: 'ccmc.gsfc.nasa.gov', label: 'DONKI', url: `https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/${type}?${range}` });
  if (type === 'FLR') sources.push({ name: 'services.swpc.noaa.gov', label: 'NOAA SWPC', days: 7, url: 'https://services.swpc.noaa.gov/json/goes/primary/xray-flares-7-day.json', swpc: true });
  const wantDebug = url.searchParams.get('debug') === '1';
  const attempts = [];
  const mask = (t) => (key ? String(t).split(key).join('***') : String(t));
  let data = null, used = null;
  for (const src of sources) {
    const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = ctl ? setTimeout(() => ctl.abort(), 4000) : null;
    try {
      const r = await fetch(src.url, { headers: { accept: 'application/json' }, signal: ctl ? ctl.signal : undefined });
      const text = await r.text();
      attempts.push({ source: src.name, status: r.status, body: mask(text.slice(0, 160)) });
      if (!r.ok) continue;
      const t = text.trim();
      try {
        data = t === '' ? [] : JSON.parse(t); // DONKI answers with an empty body when there are no events
      } catch (e) {
        attempts[attempts.length - 1].note = 'not_json';
        continue;
      }
      if (src.swpc) {
        // NOAA field names -> the same shape as DONKI flares
        data = (Array.isArray(data) ? data : []).map((e, i) => ({
          flrID: 'swpc-' + (e.begin_time || i),
          classType: e.max_class || e.begin_class || null,
          beginTime: e.begin_time || e.time_tag || null,
          peakTime: e.max_time || null,
        }));
      }
      used = src;
      break;
    } catch (e) {
      attempts.push({ source: src.name, status: 0, note: e && e.name === 'AbortError' ? 'timeout' : 'network' });
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
  const tried = attempts.map((a) => ({ source: a.source, status: a.status }));
  if (data === null) {
    const last = attempts[attempts.length - 1] || {};
    const reason = last.note === 'not_json' ? 'bad_response' : last.status ? 'upstream_' + last.status : (last.note || 'network');
    const fail = json(wantDebug ? { ok: false, reason, attempts } : { ok: false, reason, tried }, 502, wantDebug ? 'no-store' : 'public, max-age=300');
    // remember a failure for 5 minutes so visitors do not each wait through the timeouts
    if (cache && !wantDebug && context.waitUntil) context.waitUntil(cache.put(cacheKey, fail.clone()));
    return fail;
  }
  const res = json({ ok: true, type, days: used.days || days, source: used.label, fetched: new Date().toISOString(), ...trim(type, data), ...(wantDebug ? { attempts } : {}) }, 200, wantDebug ? 'no-store' : 'public, max-age=3600');
  if (cache && !wantDebug && context.waitUntil) context.waitUntil(cache.put(cacheKey, res.clone()));
  return res;
}
