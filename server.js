// Pinacello — statische site + Mailchimp-koppeling
// De Mailchimp API-key staat NOOIT in de code. Zet hem als environment variable
// op Railway:  MAILCHIMP_API_KEY   (verplicht, formaat: xxxxxxxx-usXX)
// Optioneel:   MAILCHIMP_AUDIENCE_ID (anders gebruikt de server de eerste audience)

const express = require('express');
const crypto = require('crypto');
const app = express();
app.use(express.json());
// extensions:['html'] → /verhaal serveert verhaal.html, /terms → terms.html, enz.
app.use(express.static(__dirname, { extensions: ['html'] }));

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

    return res.json({ ok: true, tag: source });
  } catch (err) {
    console.error('Serverfout', err);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Pinacello draait op poort ${PORT}`));
