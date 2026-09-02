/**
 * Cloudflare Pages Function — POST /api/contact
 *
 * Deployed automatically with Cloudflare Pages (the `functions/` directory is
 * picked up at build time). Set these optional environment variables in the
 * Cloudflare dashboard to enable email delivery via Resend:
 *
 *   RESEND_API_KEY  — API key from resend.com
 *   CONTACT_TO      — destination inbox (e.g. hello@bitsserver.com)
 *   CONTACT_FROM    — verified sender (e.g. website@bitsserver.com)
 *
 * Without them the endpoint still validates and accepts the payload so the
 * front-end can confirm receipt; wire it to your CRM or a queue as needed.
 */

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid JSON' }, 400);
  }

  const name = String(body.name || '').trim().slice(0, 120);
  const email = String(body.email || '').trim().slice(0, 160);
  const topic = String(body.topic || 'General').trim().slice(0, 80);
  const message = String(body.message || '').trim().slice(0, 4000);

  if (!name || !message || !/^\S+@\S+\.\S+$/.test(email)) {
    return json({ ok: false, error: 'Missing or invalid fields' }, 422);
  }

  if (env.RESEND_API_KEY && env.CONTACT_TO && env.CONTACT_FROM) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: env.CONTACT_FROM,
        to: [env.CONTACT_TO],
        reply_to: email,
        subject: `Project enquiry — ${topic}`,
        text: `Name: ${name}\nEmail: ${email}\nTopic: ${topic}\n\n${message}`,
      }),
    });
    if (!res.ok) return json({ ok: false, error: 'Delivery failed' }, 502);
  }

  return json({ ok: true });
}

export const onRequestOptions = () =>
  new Response(null, {
    status: 204,
    headers: { allow: 'POST, OPTIONS' },
  });
