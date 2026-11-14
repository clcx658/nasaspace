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

// Search the NASA Image and Video Library for a topic. Returns { status, photos|null, text }.
async function searchPhotos(topic, max = 8) {
  const q = TOPICS[topic];
  const r = await getJson(`https://images-api.nasa.gov/search?media_type=image&page_size=30&q=${encodeURIComponent(q)}`);
  const items = r.data && r.data.collection && Array.isArray(r.data.collection.items) ? r.data.collection.items : null;
  if (r.status !== 200 || !items) return { status: r.status, photos: null, text: r.text };
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
    if (photos.length >= max) break;
  }
  return { status: r.status, photos, text: r.text };
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const kind = url.searchParams.get('kind') || 'photo';
  const debug = url.searchParams.get('debug') === '1';
  const key = (env && env.NASA_API_KEY) || '';
  const hide = (t) => (key ? String(t).split(key).join('***') : String(t));

  try {
    if (kind === 'apod') {
      const k = encodeURIComponent(key || 'DEMO_KEY');
      let r = await getJson(`https://api.nasa.gov/planetary/apod?thumbs=true&api_key=${k}`);
      if (r.status !== 200 || !r.data || !r.data.title) {
        const r2 = await getJson(`https://api.nasa.gov/planetary/apod?api_key=${k}`); // some NASA errors only hit the thumbs option
        if (r2.status === 200 && r2.data && r2.data.title) r = r2; else if (debug) r.retry = r2.status;
      }
      if (debug) return json({ status: r.status, retry: r.retry || null, usedKey: !!key, body: hide(r.text).slice(0, 600) });
      const d = r.data;
      // NASA's service sometimes answers with a site logo or placeholder instead of a real picture: do not use those.
      const junk = (u) => /logo|\/themes\/|\/assets\/images\/|placeholder|favicon|\.svg(\?|$)/i.test(String(u || ''));
      const good = r.status === 200 && d && d.title && !/^nasa science$/i.test(String(d.title).trim()) &&
        !junk(d.media_type === 'video' ? d.thumbnail_url : d.url);
      if (good) {
        const isVideo = d.media_type === 'video';
        const image = safeUrl(isVideo ? d.thumbnail_url : d.url, ['nasa.gov', 'apod.nasa.gov', 'youtube.com', 'ytimg.com', 'vimeo.com']);
        if (image) {
          return json({
            ok: true, kind: 'apod', date: d.date || null, title: String(d.title).slice(0, 120),
            text: shortText(d.explanation), image, video: isVideo,
            credit: d.copyright ? String(d.copyright).replace(/\s+/g, ' ').trim().slice(0, 60) : null,
            link: 'https://apod.nasa.gov/apod/astropix.html',
          }, 200, 'public, max-age=3600');
        }
      }
      // Backup when NASA's picture-of-the-day service is down: a real NASA picture that changes every day.
      const names = ['moon', 'earth', 'artemis', 'sun', 'crater', 'rover', 'base'];
      const day = Math.floor(Date.now() / 86400000);
      const fb = await searchPhotos(names[day % names.length], 30);
      if (fb.photos && fb.photos.length) {
        const p = fb.photos[day % fb.photos.length];
        return json({ ok: true, kind: 'apod', fallback: true, date: p.date, title: p.title, text: p.text, image: p.image, video: false, credit: null, link: p.link }, 200, 'public, max-age=3600');
      }
      return json({ ok: false, reason: 'upstream_' + r.status }, 502, 'public, max-age=300');
    }

    const topic = url.searchParams.get('topic') || 'moon';
    if (!TOPICS[topic]) return json({ ok: false, reason: 'bad_topic' }, 400);
    const sr = await searchPhotos(topic);
    if (debug) return json({ status: sr.status, topic, body: hide(sr.text).slice(0, 600) });
    if (!sr.photos) return json({ ok: false, reason: 'upstream_' + sr.status }, 502, 'public, max-age=300');
    const photos = sr.photos;
    if (!photos.length) return json({ ok: false, reason: 'no_results' }, 502, 'public, max-age=300');
    return json({ ok: true, kind: 'photo', topic, photos }, 200, 'public, max-age=86400');
  } catch (e) {
    return json({ ok: false, reason: e && e.name === 'AbortError' ? 'timeout' : 'error' }, 502, 'public, max-age=60');
  }
}
