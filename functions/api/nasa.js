// Cloudflare Pages Function: /api/nasa
// Real NASA pictures for the learning experience. The NASA key (secret NASA_API_KEY) stays on the server and is optional.
//
//   GET /api/nasa?kind=apod                      NASA's Astronomy Picture of the Day (uses the key, or NASA's shared DEMO_KEY)
//   GET /api/nasa?kind=photo&topic=crater        real photos from the NASA Image and Video Library (needs no key)
//     topic: moon | crater | suit | artemis | rover | earth | sun | lab | base | food | panels
//   add &debug=1 to see what NASA answered (the key is hidden)
//
// Only the fixed topics below are searched, so the function cannot be used as a general search proxy.
// Good answers are cached for a day (photos) or an hour (picture of the day); failures for 5 minutes.

const TOPICS = {
  moon: 'moon surface',
  crater: 'moon crater',
  suit: 'artemis spacesuit',
  artemis: 'artemis moon mission',
  rover: 'lunar rover',
  earth: 'earthrise moon',
  sun: 'sun solar flare',
  lab: 'astronaut experiment international space station',
  base: 'moon base habitat',
  food: 'astronaut eating food space station',
  panels: 'solar array panels space station',
};

const json = (body, status = 200, cache = 'no-store') =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': cache },
  });

async function getJson(url, ms = 5000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctl.signal, headers: { accept: 'application/json' } });
    const text = await r.text();
    let data = null;
    try { data = JSON.parse(text); } catch (e) { /* not JSON */ }
    return { status: r.status, data, text };
  } finally {
    clearTimeout(t);
  }
}

// First sentence of a description, cut to a child-sized length, with tags removed.
function shortText(s, max = 150) {
  const plain = String(s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!plain) return '';
  const first = (plain.match(/^.*?[.!?](\s|$)/) || [plain])[0].trim();
  if (first.length <= max) return first;
  return first.slice(0, max - 1).replace(/\s+\S*$/, '') + '…';
}

const safeUrl = (u, hosts) => {
  try {
    const x = new URL(u);
    return x.protocol === 'https:' && hosts.some((h) => x.hostname === h || x.hostname.endsWith('.' + h)) ? x.toString() : null;
  } catch (e) { return null; }
};

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const kind = url.searchParams.get('kind') || 'photo';
  const debug = url.searchParams.get('debug') === '1';
  const key = (env && env.NASA_API_KEY) || '';
  const hide = (t) => (key ? String(t).split(key).join('***') : String(t));

  try {
    if (kind === 'apod') {
      const api = `https://api.nasa.gov/planetary/apod?thumbs=true&api_key=${encodeURIComponent(key || 'DEMO_KEY')}`;
      const r = await getJson(api);
      if (debug) return json({ status: r.status, usedKey: !!key, body: hide(r.text).slice(0, 600) });
      const d = r.data;
      if (r.status !== 200 || !d || !d.title) return json({ ok: false, reason: 'upstream_' + r.status }, 502, 'public, max-age=300');
      const isVideo = d.media_type === 'video';
      const image = safeUrl(isVideo ? d.thumbnail_url : d.url, ['nasa.gov', 'apod.nasa.gov', 'youtube.com', 'ytimg.com', 'vimeo.com']);
      if (!image) return json({ ok: false, reason: 'no_image' }, 502, 'public, max-age=300');
      return json({
        ok: true, kind: 'apod', date: d.date || null, title: String(d.title).slice(0, 120),
        text: shortText(d.explanation), image, video: isVideo,
        credit: d.copyright ? String(d.copyright).replace(/\s+/g, ' ').trim().slice(0, 60) : null,
        link: 'https://apod.nasa.gov/apod/astropix.html',
      }, 200, 'public, max-age=3600');
    }

    const topic = url.searchParams.get('topic') || 'moon';
    const q = TOPICS[topic];
    if (!q) return json({ ok: false, reason: 'bad_topic' }, 400);
    const api = `https://images-api.nasa.gov/search?media_type=image&page_size=30&q=${encodeURIComponent(q)}`;
    const r = await getJson(api);
    if (debug) return json({ status: r.status, topic, body: hide(r.text).slice(0, 600) });
    const items = r.data && r.data.collection && Array.isArray(r.data.collection.items) ? r.data.collection.items : null;
    if (r.status !== 200 || !items) return json({ ok: false, reason: 'upstream_' + r.status }, 502, 'public, max-age=300');
    const photos = [];
    for (const it of items) {
      const d = it && it.data && it.data[0];
      const pre = it && Array.isArray(it.links) ? it.links.find((l) => l.rel === 'preview' && l.href) : null;
      const image = pre ? safeUrl(String(pre.href).replace(/^http:/, 'https:'), ['nasa.gov']) : null;
      if (!d || !d.title || !d.nasa_id || !image || d.media_type !== 'image') continue;
      photos.push({
        id: d.nasa_id, title: String(d.title).slice(0, 110), text: shortText(d.description),
        image, date: d.date_created ? String(d.date_created).slice(0, 10) : null,
        link: 'https://images.nasa.gov/details/' + encodeURIComponent(d.nasa_id),
      });
      if (photos.length >= 8) break;
    }
    if (!photos.length) return json({ ok: false, reason: 'no_results' }, 502, 'public, max-age=300');
    return json({ ok: true, kind: 'photo', topic, photos }, 200, 'public, max-age=86400');
  } catch (e) {
    return json({ ok: false, reason: e && e.name === 'AbortError' ? 'timeout' : 'error' }, 502, 'public, max-age=60');
  }
}
