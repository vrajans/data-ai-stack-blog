/**
 * Newsletter API for varath.dev — runs ONLY for /api/* (see run_worker_first in wrangler.jsonc).
 * Every other request is served straight from static assets (free, unlimited).
 *
 * Endpoints
 *   POST /api/subscribe     email (+ Turnstile token)  → pending row + confirmation email (double opt-in)
 *   POST /api/confirm       token                       → status = confirmed
 *   POST /api/unsubscribe   token (form or ?token=)     → status = unsubscribed (also RFC 8058 one-click)
 *   GET  /api/admin/subscribers.csv  Authorization: Bearer ADMIN_TOKEN → export confirmed subscribers
 *
 * Storage: Cloudflare D1 (SQLite). Table is created automatically on first use.
 * Secrets (set in Cloudflare → Worker → Settings → Variables and Secrets):
 *   RESEND_API_KEY, TURNSTILE_SECRET, ADMIN_TOKEN
 */

// Minimal Cloudflare types (wrangler bundles this file with esbuild; no extra packages needed).
interface D1Result<T = Record<string, unknown>> { results: T[]; meta: { changes?: number } }
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<D1Result>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
}
interface D1Database { prepare(sql: string): D1PreparedStatement; exec(sql: string): Promise<unknown> }
interface Fetcher { fetch(req: Request): Promise<Response> }

export interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  SITE_URL: string;              // https://varath.dev
  FROM_EMAIL: string;            // "Data & AI with Varath <newsletter@varath.dev>"
  REPLY_TO?: string;
  RESEND_API_KEY?: string;
  TURNSTILE_SECRET?: string;
  ADMIN_TOKEN?: string;
  EMAIL_MODE?: string;           // "log" = print emails instead of sending (local dev)
  ALLOW_NO_TURNSTILE?: string;   // "true" only in local dev (.dev.vars)
  DAILY_EMAIL_CAP?: string;      // default 90 (Resend free plan allows 100/day)
}

type Sub = { id: number; email: string; status: string; token: string; created_at: string; last_sent_at: string | null };

const SCHEMA = `
CREATE TABLE IF NOT EXISTS subscribers (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  email           TEXT NOT NULL UNIQUE COLLATE NOCASE,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','unsubscribed')),
  token           TEXT NOT NULL UNIQUE,
  source          TEXT,
  consent_text    TEXT,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  last_sent_at    TEXT,
  confirmed_at    TEXT,
  unsubscribed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_subscribers_status ON subscribers(status);
CREATE INDEX IF NOT EXISTS idx_subscribers_last_sent ON subscribers(last_sent_at);`;

const CONSENT = 'Subscribed via varath.dev form: one email per new article, unsubscribe anytime (privacy policy v1).';
const RESEND_COOLDOWN_MIN = 10;
const CONFIRM_TTL_DAYS = 7;
const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]{1,64}@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

let schemaReady = false;
async function ensureSchema(db: D1Database) {
  if (schemaReady) return;
  for (const stmt of SCHEMA.split(';').map((s) => s.trim()).filter(Boolean)) await db.prepare(stmt).run();
  schemaReady = true;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    try {
      const route = `${request.method} ${url.pathname.replace(/\/+$/, '')}`;
      switch (route) {
        case 'POST /api/subscribe': return await subscribe(request, env, url);
        case 'POST /api/confirm': return await confirm(request, env);
        case 'POST /api/unsubscribe': return await unsubscribe(request, env, url);
        case 'GET /api/admin/subscribers.csv': return await exportCsv(request, env);
        case 'GET /api/health': return json({ ok: true });
        default: return json({ ok: false, message: 'Not found.' }, 404);
      }
    } catch (err) {
      console.error('api error', err);
      return json({ ok: false, message: 'Something went wrong. Please try again in a minute.' }, 500);
    }
  },

  // Daily cron (wrangler.jsonc → triggers): delete sign-ups that were never confirmed within 7 days.
  async scheduled(_event: unknown, env: Env): Promise<void> {
    if (!env.DB) return;
    await ensureSchema(env.DB);
    const cutoff = new Date(Date.now() - CONFIRM_TTL_DAYS * 86400000).toISOString().replace(/\.\d{3}Z$/, 'Z');
    const r = await env.DB.prepare("DELETE FROM subscribers WHERE status = 'pending' AND created_at < ?").bind(cutoff).run();
    console.log('expired pending sign-ups removed:', r.meta.changes ?? 0);
  },
};

// ---------- handlers ----------

async function subscribe(request: Request, env: Env, url: URL): Promise<Response> {
  if (!sameOrigin(request, env)) return json({ ok: false, message: 'Invalid origin.' }, 403);
  const form = await readForm(request);
  const wantsHtml = !(request.headers.get('accept') ?? '').includes('application/json');
  const done = (message: string, status = 200) =>
    wantsHtml ? Response.redirect(new URL(status < 400 ? '/subscribe/check-inbox/' : '/subscribe/error/', env.SITE_URL || url.origin).href, 303) : json({ ok: status < 400, message }, status);

  // Honeypot: real people never fill the hidden "website" field. Pretend success.
  if ((form.get('website') ?? '').trim()) return done('Thanks! Check your inbox to confirm.');

  const email = (form.get('email') ?? '').trim().toLowerCase();
  if (email.length > 254 || !EMAIL_RE.test(email)) return done('Please enter a valid email address.', 400);

  if (!(await verifyTurnstile(form.get('cf-turnstile-response') ?? '', request, env)))
    return done('Please complete the quick “I’m human” check and try again.', 400);

  if (!env.DB) return done('Subscriptions are not set up yet.', 503);
  await ensureSchema(env.DB);

  const generic = 'Almost done — check your inbox and click the link to confirm your subscription.';
  const existing = await env.DB.prepare('SELECT * FROM subscribers WHERE email = ?').bind(email).first<Sub>();
  const source = (form.get('source') ?? '').slice(0, 200);

  // Already confirmed: say the same thing (don't reveal who is subscribed).
  if (existing?.status === 'confirmed') return done(generic);

  // Don't resend to the same address more often than every few minutes.
  if (existing?.status === 'pending' && existing.last_sent_at && minutesSince(existing.last_sent_at) < RESEND_COOLDOWN_MIN) return done(generic);

  if (!(await underDailyCap(env))) return done('We’ve hit today’s sign-up limit — please try again tomorrow.', 429);

  const token = randomToken();
  if (!existing) {
    await env.DB.prepare('INSERT INTO subscribers (email, token, source, consent_text, last_sent_at) VALUES (?, ?, ?, ?, ?)')
      .bind(email, token, source, CONSENT, nowIso()).run();
  } else {
    // pending (cooldown passed) or previously unsubscribed → new token, back to pending
    await env.DB.prepare("UPDATE subscribers SET status = 'pending', token = ?, source = ?, consent_text = ?, created_at = ?, last_sent_at = ?, unsubscribed_at = NULL WHERE id = ?")
      .bind(token, source, CONSENT, nowIso(), nowIso(), existing.id).run();
  }

  const sent = await sendConfirmation(env, email, token);
  if (!sent) return done('We couldn’t send the confirmation email right now. Please try again later.', 502);
  return done(generic);
}

async function confirm(request: Request, env: Env): Promise<Response> {
  if (!sameOrigin(request, env)) return json({ ok: false, message: 'Invalid origin.' }, 403);
  if (!env.DB) return json({ ok: false, message: 'Subscriptions are not set up yet.' }, 503);
  const token = ((await readForm(request)).get('token') ?? '').trim();
  if (!validToken(token)) return json({ ok: false, message: 'This confirmation link is invalid.' }, 400);
  await ensureSchema(env.DB);
  const sub = await env.DB.prepare('SELECT * FROM subscribers WHERE token = ?').bind(token).first<Sub>();
  if (!sub) return json({ ok: false, message: 'This confirmation link is invalid or has already been replaced by a newer one.' }, 404);
  if (sub.status === 'confirmed') return json({ ok: true, message: 'You’re already subscribed — thank you!' });
  if (sub.status === 'unsubscribed') return json({ ok: false, message: 'This address was unsubscribed. Please subscribe again from any article.' }, 410);
  if (daysSince(sub.created_at) > CONFIRM_TTL_DAYS) return json({ ok: false, message: 'This link has expired. Please subscribe again to get a fresh one.' }, 410);
  await env.DB.prepare("UPDATE subscribers SET status = 'confirmed', confirmed_at = ? WHERE id = ?").bind(nowIso(), sub.id).run();
  return json({ ok: true, message: 'You’re subscribed. You’ll get an email when the next article is published.' });
}

async function unsubscribe(request: Request, env: Env, url: URL): Promise<Response> {
  // One-click unsubscribe from mail clients (RFC 8058) posts from the mail provider, not our site,
  // so it is identified by the token in the query string rather than the Origin header.
  const form = await readForm(request);
  const token = (url.searchParams.get('token') ?? form.get('token') ?? '').trim();
  const oneClick = (form.get('List-Unsubscribe') ?? '') === 'One-Click';
  if (!oneClick && !sameOrigin(request, env)) return json({ ok: false, message: 'Invalid origin.' }, 403);
  if (!validToken(token)) return json({ ok: false, message: 'This unsubscribe link is invalid.' }, 400);
  if (!env.DB) return json({ ok: false, message: 'Subscriptions are not set up yet.' }, 503);
  await ensureSchema(env.DB);
  const sub = await env.DB.prepare('SELECT * FROM subscribers WHERE token = ?').bind(token).first<Sub>();
  if (sub && sub.status !== 'unsubscribed')
    await env.DB.prepare("UPDATE subscribers SET status = 'unsubscribed', unsubscribed_at = ? WHERE id = ?").bind(nowIso(), sub.id).run();
  // Same answer whether or not the token existed.
  return json({ ok: true, message: 'You’ve been unsubscribed. You won’t receive any more emails.' });
}

async function exportCsv(request: Request, env: Env): Promise<Response> {
  const auth = request.headers.get('authorization') ?? '';
  if (!env.ADMIN_TOKEN || env.ADMIN_TOKEN.length < 24 || !safeEqual(auth, `Bearer ${env.ADMIN_TOKEN}`))
    return json({ ok: false, message: 'Unauthorized.' }, 401);
  if (!env.DB) return json({ ok: false, message: 'Database not bound.' }, 503);
  await ensureSchema(env.DB);
  const status = new URL(request.url).searchParams.get('status') ?? 'confirmed';
  const rows = (await env.DB.prepare('SELECT email, status, source, created_at, confirmed_at, unsubscribed_at, token FROM subscribers WHERE status = ? ORDER BY id')
    .bind(status).all<Record<string, string | null>>()).results;
  const cols = ['email', 'status', 'source', 'created_at', 'confirmed_at', 'unsubscribed_at', 'unsubscribe_url'];
  const site = env.SITE_URL || 'https://varath.dev';
  const esc = (v: unknown) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const lines = [cols.join(',')].concat(rows.map((r) => cols.map((c) => esc(c === 'unsubscribe_url' ? `${site}/subscribe/unsubscribe/?token=${r.token}` : r[c])).join(',')));
  return new Response(lines.join('\n') + '\n', {
    headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="subscribers-${status}.csv"`, 'cache-control': 'no-store' },
  });
}

// ---------- email ----------

async function sendConfirmation(env: Env, email: string, token: string): Promise<boolean> {
  const site = env.SITE_URL || 'https://varath.dev';
  const confirmUrl = `${site}/subscribe/confirm/?token=${token}`;
  const unsubUrl = `${site}/subscribe/unsubscribe/?token=${token}`;
  const subject = 'Confirm your subscription to Data & AI with Varath';
  const text = `Hi,\n\nPlease confirm that you'd like to receive an email when a new article is published on ${site.replace('https://', '')}:\n\n${confirmUrl}\n\nIf you didn't sign up, ignore this email — you won't be subscribed.\n\n— Varatharajan, Data & AI with Varath`;
  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#f6f7f9;font-family:Inter,Segoe UI,Arial,sans-serif;color:#111827">
<table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px"><tr><td style="padding:28px">
<p style="margin:0 0 6px;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:#0f766e;font-weight:700">Data &amp; AI with Varath</p>
<h1 style="margin:0 0 14px;font-size:22px;line-height:1.3">Confirm your subscription</h1>
<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#374151">Click the button to get one email whenever a new deep dive on the data &amp; AI stack is published. No spam — unsubscribe anytime.</p>
<p style="margin:0 0 22px"><a href="${confirmUrl}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:10px">Confirm subscription</a></p>
<p style="margin:0 0 6px;font-size:13px;color:#6b7280">Or paste this link into your browser:<br><a href="${confirmUrl}" style="color:#0f766e;word-break:break-all">${confirmUrl}</a></p>
<p style="margin:18px 0 0;font-size:13px;color:#6b7280">Didn't sign up? Ignore this email and you won't be subscribed.</p>
</td></tr></table></body></html>`;

  if (env.EMAIL_MODE === 'log') { console.log(`[email:log] to=${email} confirm=${confirmUrl}`); return true; }
  if (!env.RESEND_API_KEY) { console.error('RESEND_API_KEY is not set'); return false; }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json', 'idempotency-key': `confirm-${token}` },
    body: JSON.stringify({
      from: env.FROM_EMAIL, to: [email], subject, html, text,
      ...(env.REPLY_TO ? { reply_to: env.REPLY_TO } : {}),
      headers: { 'List-Unsubscribe': `<${site}/api/unsubscribe?token=${token}>, <${unsubUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
    }),
  });
  if (!res.ok) console.error('resend error', res.status, await res.text());
  return res.ok;
}

async function underDailyCap(env: Env): Promise<boolean> {
  const cap = Number(env.DAILY_EMAIL_CAP ?? 90);
  const today = new Date().toISOString().slice(0, 10);
  const row = await env.DB.prepare('SELECT COUNT(*) AS n FROM subscribers WHERE last_sent_at >= ?').bind(`${today}T00:00:00Z`).first<{ n: number }>();
  return (row?.n ?? 0) < cap;
}

// ---------- helpers ----------

async function verifyTurnstile(token: string, request: Request, env: Env): Promise<boolean> {
  if (!env.TURNSTILE_SECRET) return env.ALLOW_NO_TURNSTILE === 'true';
  if (!token) return false;
  const body = new FormData();
  body.append('secret', env.TURNSTILE_SECRET);
  body.append('response', token);
  const ip = request.headers.get('cf-connecting-ip');
  if (ip) body.append('remoteip', ip);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
  const data = (await res.json()) as { success?: boolean };
  return data.success === true;
}

function sameOrigin(request: Request, env: Env): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true; // non-browser or old browser form post; Turnstile/token still required
  const allowed = new Set([new URL(request.url).origin, env.SITE_URL].filter(Boolean));
  return allowed.has(origin);
}

async function readForm(request: Request): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const type = request.headers.get('content-type') ?? '';
  if (type.includes('application/json')) {
    const data = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    for (const [k, v] of Object.entries(data)) if (typeof v === 'string') out.set(k, v);
  } else if (type.includes('form')) {
    const fd = await request.formData();
    for (const [k, v] of fd.entries()) if (typeof v === 'string') out.set(k, v);
  }
  return out;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
}
function randomToken(): string {
  const b = crypto.getRandomValues(new Uint8Array(24));
  return btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
const validToken = (t: string) => /^[A-Za-z0-9_-]{32}$/.test(t);
const nowIso = () => new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
const minutesSince = (iso: string) => (Date.now() - Date.parse(iso)) / 60000;
const daysSince = (iso: string) => (Date.now() - Date.parse(iso)) / 86400000;
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
