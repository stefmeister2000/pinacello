// Pinacello — statische site + Mailchimp-koppeling
// De Mailchimp API-key staat NOOIT in de code. Zet hem als environment variable
// op Railway:  MAILCHIMP_API_KEY   (verplicht, formaat: xxxxxxxx-usXX)
// Optioneel:   MAILCHIMP_AUDIENCE_ID (anders gebruikt de server de eerste audience)

const express = require('express');
const crypto = require('crypto');
const app = express();
app.use(express.json());

// ── Current: first-party tracking domain ────────────────────────────────────
// promo.pinacello.com serves the Current pixel and forwards its events, so tracking runs on our own domain:
// the visitor cookie is set by this server (Safari keeps it, unlike JavaScript cookies) and blockers see our domain.
const CURRENT_ORIGIN = process.env.CURRENT_ORIGIN || 'https://performance-marketing-dashboard-production-e17c.up.railway.app';
const CURRENT_SITE_KEY = process.env.CURRENT_SITE_KEY || 'cur_rUSdLH_VK1C9hS3Z2RCK1r4lw6DaQ9sG'; // public site key
const VISITOR_RE = /^[A-Za-z0-9_-]{8,64}$/;
const VISITOR_MAX_AGE = 400 * 24 * 60 * 60;

function readCookie(req, name) {
  const m = (req.headers.cookie || '').match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : '';
}
function isProduction(req) {
  const host = (req.hostname || '').toLowerCase();
  return host === 'pinacello.com' || host.endsWith('.pinacello.com');
}
// Opaque per-visitor hash so Current's rate limits work per person, not per server.
function proxyClient(req) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  return crypto.createHash('sha256').update(ip + '|pinacello-current').digest('hex').slice(0, 32);
}
async function sendToCurrent(req, body) {
  return fetch(CURRENT_ORIGIN + '/api/collect', {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=UTF-8', 'User-Agent': req.get('user-agent') || '', 'x-proxy-client': proxyClient(req) },
    body,
    signal: AbortSignal.timeout(8000),
  });
}

// Pages get (and refresh) the shared visitor cookie on .pinacello.com, also read by the Wix shop on www.
app.use((req, res, next) => {
  const page = req.method === 'GET' && !req.path.startsWith('/api/') && (!/\.[a-z0-9]+$/i.test(req.path) || req.path.endsWith('.html'));
  if (page && isProduction(req)) {
    let visitor = readCookie(req, '_cur_vid');
    if (!VISITOR_RE.test(visitor)) visitor = crypto.randomBytes(16).toString('hex');
    res.append('Set-Cookie', `_cur_vid=${visitor}; Domain=.pinacello.com; Path=/; Max-Age=${VISITOR_MAX_AGE}; SameSite=Lax; Secure`);
  }
  next();
});

let pixelCache = { body: '', at: 0 };
app.get('/t.js', async (req, res) => {
  try {
    if (!pixelCache.body || Date.now() - pixelCache.at > 10 * 60 * 1000) {
      const r = await fetch(CURRENT_ORIGIN + '/t.js', { signal: AbortSignal.timeout(8000) });
      if (!r.ok) throw new Error('pixel ' + r.status);
      pixelCache = { body: await r.text(), at: Date.now() };
    }
  } catch (e) {
    console.error('Current pixel kon niet geladen worden', e.message);
    if (!pixelCache.body) return res.status(502).end();
  }
  res.set({ 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'public, max-age=600' }).send(pixelCache.body);
});

const COLLECT_CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Cache-Control': 'no-store' };
app.options('/api/collect', (req, res) => res.set(COLLECT_CORS).status(204).end());
app.post('/api/collect', express.text({ type: '*/*', limit: '40kb' }), async (req, res) => {
  try {
    const r = await sendToCurrent(req, typeof req.body === 'string' ? req.body : '');
    res.status(r.status).set(COLLECT_CORS).send(await r.text());
  } catch (e) {
    console.error('Current collect', e.name);
    res.status(502).set(COLLECT_CORS).end();
  }
});

// extensions:['html'] → /verhaal serveert verhaal.html, /terms → terms.html, enz.
app.use(express.static(__dirname, {
  extensions: ['html'],
  setHeaders(res, filePath) {
    // Revalidate pages; cache images/fonts/styles for a day, then use ETags.
    const asset = /\.(?:webp|jpg|jpeg|png|svg|woff2?|css)$/i.test(filePath);
    res.setHeader('Cache-Control', asset ? 'public, max-age=86400' : 'no-cache');
  },
}));

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Mailchimp-datacenter zit achteraan in de key (bv. "...-us16").
function mcDc(key) { return (key || '').split('-').pop(); }
function mcAuth(key) { return 'Basic ' + Buffer.from('anystring:' + key).toString('base64'); }
function mcUrl(key, path) { return `https://${mcDc(key)}.api.mailchimp.com/3.0${path}`; }

// Onthoudt de audience-id zodat we ze niet elke keer opnieuw moeten opzoeken.
let cachedListId = process.env.MAILCHIMP_AUDIENCE_ID || null;

// Zoekt de audience-id op (of gebruikt de eerste als er geen env var is).
async function resolveList(key) {
  if (cachedListId) return cachedListId;
  const r = await fetch(mcUrl(key, '/lists?fields=lists.id,lists.name'), { headers: { Authorization: mcAuth(key) } });
  if (!r.ok) throw new Error(`lists ophalen faalde: ${r.status} ${await r.text()}`);
  const lists = (await r.json()).lists || [];
  if (!lists.length) throw new Error('geen enkele Mailchimp-audience gevonden');
  cachedListId = lists[0].id;
  console.log(`Mailchimp-audience: "${lists[0].name}" (${lists[0].id})`);
  return cachedListId;
}

// Diagnose: open /api/health in de browser. Toont GEEN geheimen.
app.get('/api/health', async (req, res) => {
  const key = process.env.MAILCHIMP_API_KEY;
  let listId = null, listError = null;
  if (key) {
    try { listId = await resolveList(key); }
    catch (e) { listError = String(e.message || e); }
  }
  res.json({
    server: 'ok',
    node_has_fetch: typeof fetch === 'function',
    MAILCHIMP_API_KEY: key ? 'set ✓' : 'MISSING ✗',
    datacenter: key ? mcDc(key) : null,
    audience_id: listId,
    audience_error: listError,
    ready_to_save: !!(key && listId),
  });
});

app.post('/api/subscribe', async (req, res) => {
  const email = ((req.body && req.body.email) || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ ok: false, error: 'invalid_email' });
  }

  const key = process.env.MAILCHIMP_API_KEY;
  if (!key) {
    console.error('Ontbrekende env var: MAILCHIMP_API_KEY');
    return res.status(500).json({ ok: false, error: 'not_configured' });
  }

  try {
    const listId = await resolveList(key);
    // PUT met subscriber-hash = idempotente upsert: voegt toe als nieuw, negeert dubbels.
    const hash = crypto.createHash('md5').update(email).digest('hex');
    const r = await fetch(mcUrl(key, `/lists/${listId}/members/${hash}`), {
      method: 'PUT',
      headers: { Authorization: mcAuth(key), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email_address: email,
        status_if_new: 'subscribed', // nieuw contact meteen ingeschreven
        merge_fields: {},
      }),
    });

    if (!r.ok) {
      const detail = await r.text();
      console.error('Mailchimp-fout', r.status, detail);
      return res.status(502).json({ ok: false, error: 'mailchimp_failed' });
    }

    // Tag toevoegen op basis van de bron, zodat je bv. de pop-up-inschrijvingen
    // apart kan filteren/segmenteren in Mailchimp (Audience → Tags).
    const source = String((req.body && req.body.source) || 'website')
      .toLowerCase().replace(/[^a-z0-9_-]+/g, '-').slice(0, 40) || 'website';
    try {
      await fetch(mcUrl(key, `/lists/${listId}/members/${hash}/tags`), {
        method: 'POST',
        headers: { Authorization: mcAuth(key), 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: [{ name: source, status: 'active' }] }),
      });
    } catch (e) { console.error('tag-fout', e); }

    // Link this visitor to the subscriber in Current, server-side (works with ad blockers too).
    const visitor = readCookie(req, '_cur_vid');
    if (VISITOR_RE.test(visitor)) {
      const id = () => crypto.randomBytes(12).toString('hex');
      const session = VISITOR_RE.test(readCookie(req, '_cur_sid')) ? readCookie(req, '_cur_sid') : id();
      sendToCurrent(req, JSON.stringify({ key: CURRENT_SITE_KEY, visitor, session, events: [{ id: id(), type: 'lead', email, url: req.get('referer') || 'https://promo.pinacello.com/' }] }))
        .catch(e => console.error('Current lead', e.name));
    }

    return res.json({ ok: true, tag: source });
  } catch (err) {
    console.error('Serverfout', err);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Pinacello draait op poort ${PORT}`));
