// Pinacello — statische site + Resend-koppeling
// De Resend API-key staat NOOIT in de code. Zet hem als environment variable
// op Railway:  RESEND_API_KEY   (verplicht)
// Optioneel:   RESEND_AUDIENCE_ID (anders maakt de server de lijst zelf aan)
//              RESEND_AUDIENCE_NAME (naam van de lijst, standaard 'Pinacello nieuwsbrief')
//              RESEND_FROM (welkomstmail — vereist een geverifieerd domein)

const express = require('express');
const app = express();
app.use(express.json());
app.use(express.static(__dirname)); // serveert index.html, verhaal.html, /markets, /craft, ...

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const AUDIENCE_NAME = process.env.RESEND_AUDIENCE_NAME || 'Pinacello nieuwsbrief';

// Onthoudt de audience-id zodat we ze niet elke keer opnieuw moeten opzoeken.
let cachedAudienceId = process.env.RESEND_AUDIENCE_ID || null;

// Bepaalt in welke lijst de contacten belanden.
// Voorkeur: lijst met naam AUDIENCE_NAME → anders de standaardlijst ("Contacts")
// → anders maakt hij er zelf een aan. Zo verschijnen contacten altijd zichtbaar
// in het Resend-dashboard, ook in het nieuwe Contacts/Segments/Topics-model.
async function resolveAudience(KEY) {
  if (cachedAudienceId) return cachedAudienceId;

  const listRes = await fetch('https://api.resend.com/audiences', {
    headers: { Authorization: `Bearer ${KEY}` },
  });
  if (listRes.ok) {
    const audiences = (await listRes.json()).data || [];
    const named = audiences.find((a) => a.name === AUDIENCE_NAME);
    if (named) {
      cachedAudienceId = named.id;
      console.log(`Resend-lijst gevonden: "${AUDIENCE_NAME}" (${named.id})`);
      return cachedAudienceId;
    }
    if (audiences.length) {
      cachedAudienceId = audiences[0].id; // standaardlijst (Contacts)
      console.log(`Resend standaardlijst gebruikt: "${audiences[0].name}" (${audiences[0].id})`);
      return cachedAudienceId;
    }
  }

  // Geen enkele lijst gevonden: maak er een aan.
  const createRes = await fetch('https://api.resend.com/audiences', {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: AUDIENCE_NAME }),
  });
  if (!createRes.ok) {
    throw new Error(`audience aanmaken faalde: ${createRes.status} ${await createRes.text()}`);
  }
  const created = await createRes.json();
  cachedAudienceId = created.id;
  console.log(`Resend-lijst aangemaakt: "${AUDIENCE_NAME}" (${created.id})`);
  return cachedAudienceId;
}

// Diagnose: open /api/health in de browser om te zien of alles goed staat.
// Toont GEEN geheimen — enkel of de key aanwezig is en welke lijst gebruikt wordt.
app.get('/api/health', async (req, res) => {
  const KEY = process.env.RESEND_API_KEY;
  let audience = null, audienceError = null;
  if (KEY) {
    try { audience = await resolveAudience(KEY); }
    catch (e) { audienceError = String(e.message || e); }
  }
  res.json({
    server: 'ok',
    node_has_fetch: typeof fetch === 'function',
    RESEND_API_KEY: KEY ? 'set ✓' : 'MISSING ✗',
    RESEND_FROM: process.env.RESEND_FROM ? 'set ✓ (welkomstmail aan)' : 'niet gezet (geen welkomstmail)',
    audience_name: AUDIENCE_NAME,
    audience_id: audience,
    audience_error: audienceError,
    ready_to_save: !!(KEY && audience),
  });
});

app.post('/api/subscribe', async (req, res) => {
  const email = ((req.body && req.body.email) || '').trim().toLowerCase();

  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ ok: false, error: 'invalid_email' });
  }

  const KEY = process.env.RESEND_API_KEY;
  if (!KEY) {
    console.error('Ontbrekende env var: RESEND_API_KEY');
    return res.status(500).json({ ok: false, error: 'not_configured' });
  }

  try {
    // De lijst opzoeken of aanmaken (gebeurt automatisch, maar één keer).
    const AUDIENCE = await resolveAudience(KEY);

    // Contact toevoegen aan de Resend-lijst.
    const add = await fetch(`https://api.resend.com/audiences/${AUDIENCE}/contacts`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, unsubscribed: false }),
    });

    if (!add.ok && add.status !== 409) { // 409 = bestaat al, dat is ok
      const detail = await add.text();
      console.error('Resend contact-fout', add.status, detail);
      return res.status(502).json({ ok: false, error: 'resend_failed' });
    }

    // Optionele welkomstmail met de kortingscode — enkel als RESEND_FROM gezet is
    // en het domein geverifieerd is in Resend.
    if (process.env.RESEND_FROM) {
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: process.env.RESEND_FROM,
          to: email,
          subject: 'Je 5% kortingscode 🍍',
          html: `<div style="font-family:sans-serif;font-size:16px;color:#472B0E;line-height:1.6">
            <p>Welkom bij Pinacello! ☀️</p>
            <p>Hier is je code voor <b>5% korting</b> op je eerste bestelling:</p>
            <p style="font-size:26px;font-weight:800;letter-spacing:2px;color:#F04E23">ZOMER5</p>
            <p>Proost — en geniet met mate.</p>
          </div>`,
        }),
      }).catch((e) => console.error('Resend mail-fout', e));
    }

    return res.json({ ok: true, code: 'ZOMER5' });
  } catch (err) {
    console.error('Serverfout', err);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Pinacello draait op poort ${PORT}`));
