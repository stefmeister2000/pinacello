// Pinacello — statische site + Resend-koppeling
// De Resend API-key staat NOOIT in de code. Zet hem als environment variable
// op Railway:  RESEND_API_KEY  en  RESEND_AUDIENCE_ID  (en optioneel RESEND_FROM).

const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(__dirname)); // serveert index.html, verhaal.html, /markets, /craft, ...

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

app.post('/api/subscribe', async (req, res) => {
  const email = ((req.body && req.body.email) || '').trim().toLowerCase();
  const source = (req.body && req.body.source) || 'website';

  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ ok: false, error: 'invalid_email' });
  }

  const KEY = process.env.RESEND_API_KEY;
  const AUDIENCE = process.env.RESEND_AUDIENCE_ID;
  if (!KEY || !AUDIENCE) {
    console.error('Ontbrekende env vars: RESEND_API_KEY en/of RESEND_AUDIENCE_ID');
    return res.status(500).json({ ok: false, error: 'not_configured' });
  }

  try {
    // 1) Contact toevoegen aan de Resend-audience (de "lijst")
    const add = await fetch(`https://api.resend.com/audiences/${AUDIENCE}/contacts`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, unsubscribed: false }),
    });

    if (!add.ok && add.status !== 409) { // 409 = bestaat al, dat is ok
      const detail = await add.text();
      console.error('Resend audience-fout', add.status, detail);
      return res.status(502).json({ ok: false, error: 'resend_failed' });
    }

    // 2) (optioneel) welkomstmail met de kortingscode — enkel als RESEND_FROM gezet is
    //    en het domein geverifieerd is in Resend.
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
