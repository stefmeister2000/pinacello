const crypto = require('node:crypto');
const SOURCE = 'drink-with-your-friends';
const CONSENT_TEXT = 'Ik ontvang graag recepten, nieuws en aanbiedingen van Pinacello per e-mail.';

function createFriendsSignup({ resolveList, mcUrl, mcAuth, fetchImpl = fetch, apiKey = () => process.env.MAILCHIMP_API_KEY, now = Date.now, clientKey }) {
  const attempts = new Map();
  return async function friendsSignup(req, res) {
    res.set('Cache-Control', 'no-store');
    const origin = req.get('origin');
    if (origin) {
      try { if (new URL(origin).host !== req.get('host')) return res.status(403).json({ok:false,error:'invalid_origin'}); }
      catch { return res.status(403).json({ok:false,error:'invalid_origin'}); }
    }
    const body = req.body || {};
    const name = typeof body.name === 'string' ? body.name.trim().replace(/\s+/g, ' ') : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!name || name.length > 100 || /[\x00-\x1f\x7f]/.test(name)) return res.status(400).json({ok:false,error:'invalid_name'});
    if (email.length > 254 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ok:false,error:'invalid_email'});
    if (body.website) return res.status(400).json({ok:false,error:'invalid_submission'});
    const time = now();
    for (const [id, bucket] of attempts) if (bucket.until <= time) attempts.delete(id);
    const id = clientKey(req);
    const bucket = attempts.get(id) || {count:0,until:time + 60*60*1000};
    if (bucket.count >= 10) return res.set('Retry-After',String(Math.ceil((bucket.until-time)/1000))).status(429).json({ok:false,error:'rate_limited'});
    bucket.count++; attempts.set(id,bucket);
    const key = apiKey();
    if (!key) return res.status(503).json({ok:false,error:'not_configured'});
    const marketing = body.marketing === true;
    try {
      const list = await resolveList(key);
      const hash = crypto.createHash('md5').update(email).digest('hex');
      const base = `/lists/${list}/members/${hash}`;
      async function write(path, method, data) {
        const result = await fetchImpl(mcUrl(key,path), {method,headers:{Authorization:mcAuth(key),'Content-Type':'application/json'},body:JSON.stringify(data),signal:AbortSignal.timeout(8000)});
        if (!result.ok) throw new Error('mailchimp_' + result.status);
        return result;
      }
      // Never overwrite an existing subscriber's status or resubscribe an opted-out contact.
      await write(base,'PUT',{email_address:email,status_if_new:marketing?'subscribed':'transactional',merge_fields:{FNAME:name}});
      await write(base+'/tags','POST',{tags:[{name:SOURCE,status:'active'}]});
      await write(base+'/notes','POST',{note:JSON.stringify({source:SOURCE,form_version:'2026-11-05',submitted_at:new Date(time).toISOString(),marketing_opt_in:marketing,consent_text:CONSENT_TEXT})});
      return res.json({ok:true,code:'FRIENDS'});
    } catch(error) {
      // No email, name, API key or Mailchimp response body in logs.
      console.error('Friends signup failed:', /^mailchimp_\d+$/.test(error.message)?error.message:error.name);
      return res.status(502).json({ok:false,error:'mailchimp_failed'});
    }
  };
}
module.exports = {createFriendsSignup};
