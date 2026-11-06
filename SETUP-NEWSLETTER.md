# Newsletter, comments & sharing — setup

The site now has its own email list:

- Subscribers are stored in **Cloudflare D1** (serverless SQLite) by the small Worker in `worker/index.ts`.
- The Worker runs **only for `/api/*`**. Every page view is still served as a free static asset.
- **Double opt-in:** a confirmation email is sent through **Resend**. A reader is only subscribed after they click the link in that email.
- **Cloudflare Turnstile** blocks bot sign-ups.
- Unconfirmed sign-ups are deleted automatically after 7 days by a daily cron job.

Everything below is free. Do the steps in order (about 30–40 minutes), then push.

---

## 1. Create the database (D1)

1. In the Cloudflare dashboard, go to **Storage & databases → D1 SQL database → Create**.
2. Name it `varath-subscribers` and click **Create**.
3. Copy the **Database ID**.
4. In `wrangler.jsonc`, remove the `//` from the 7 `"d1_databases"` lines and paste the ID in place of `PASTE-YOUR-D1-DATABASE-ID-HERE`.

The table is created automatically on the first sign-up.

## 2. Turnstile (bot protection)

1. In the Cloudflare dashboard, go to **Turnstile → Add widget**.
2. Fill in the widget:
   - Name: `varath.dev newsletter`
   - Hostname: `varath.dev`
   - Widget mode: **Managed**
3. Copy the two keys:
   - **Site key** → paste into `turnstileSiteKey` in `src/config.ts`. This key is public.
   - **Secret key** → keep it for step 5.

## 3. Resend (sends the confirmation emails)

1. Sign up at resend.com. The free plan covers 3,000 emails/month and 100/day.
2. Go to **Domains → Add domain** and enter `varath.dev`.
3. Add the DNS records Resend shows. The easiest way is the **Cloudflare auto-configure** button; otherwise add them under Cloudflare → varath.dev → DNS.
4. Wait until the domain shows **Verified**.
5. If Cloudflare has no `_dmarc` TXT record yet, add one:
   - Name: `_dmarc`
   - Value: `v=DMARC1; p=none;`
6. Go to **API Keys → Create API key**:
   - Permission: **Sending access**
   - Domain: `varath.dev`
7. Copy the key for step 5.

## 4. A contact address (Email Routing)

The privacy page lists `hello@varath.dev`.

1. In the Cloudflare dashboard, go to **varath.dev → Email → Email Routing → Get started**.
2. Create the custom address `hello` and forward it to your Gmail.
3. Optionally, also forward `newsletter@varath.dev`, so replies to the confirmation email reach you.

## 5. Worker secrets

1. Go to **Workers & Pages → data-ai-stack → Settings → Variables and Secrets → Add**.
2. For each name below, choose type **Secret**:

| Name | Value |
|---|---|
| `RESEND_API_KEY` | the Resend key from step 3 |
| `TURNSTILE_SECRET` | the Turnstile secret key from step 2 |
| `ADMIN_TOKEN` | a long random password (30+ characters, e.g. from your password manager), used to export the list |

Secrets are never stored in the repository.

## 6. Switch it on and deploy

1. In `src/config.ts`, set `newsletter.enabled: true`.
2. Push:

```
cd "C:\Projects\Data & AI Content\data-ai-stack-blog"
git add .
git commit -m "Own newsletter: D1 + double opt-in"
git push
```

## 7. Test

1. Subscribe on any article with your own email.
2. Open the confirmation email and click **Confirm**.
3. Check the row. Go to **D1 → varath-subscribers → Console** and run:

   ```sql
   SELECT email, status, created_at, confirmed_at FROM subscribers;
   ```

If the email doesn't arrive, look at **Worker → Logs** and **Resend → Emails**.

## Export your list (any time)

**PowerShell:**

```powershell
Invoke-WebRequest -Uri "https://varath.dev/api/admin/subscribers.csv" -Headers @{ Authorization = "Bearer YOUR_ADMIN_TOKEN" } -OutFile subscribers.csv
```

The CSV includes each subscriber's personal unsubscribe link. Add `?status=unsubscribed` to the URL to get the opt-out list instead.

**Sending a newsletter later:** import the confirmed list into any sender, for example Resend Broadcasts (free up to 1,000 contacts), or ask Claude to add a send script. Every newsletter must include the subscriber's unsubscribe link.

---

## Comments (giscus — GitHub Discussions)

1. The repository must be **public**.
2. In GitHub, go to **repo → Settings → General → Features** and tick **Discussions**.
3. Install the giscus app at https://github.com/apps/giscus and select **only this repository**.
4. In **repo → Discussions → Categories**, create a new category:
   - Name: `Comments`
   - Format: **Announcement** (so only giscus creates threads)
5. Open https://giscus.app and fill in the form:
   - Repository: `vrajans/data-ai-stack-blog`
   - Mapping: **pathname**
   - Category: `Comments`
6. From the generated script, copy `data-repo`, `data-repo-id`, `data-category` and `data-category-id` into `giscus` in `src/config.ts`, then push.

Comments and emoji reactions then appear under every article. Moderate them from GitHub (Discussions → hide, lock or delete).

## Share buttons

These are already live on every article:

- LinkedIn, X, WhatsApp, Hacker News, Reddit and Copy link.
- A **More…** button opens the phone or computer's native share sheet where supported.
- No tracking scripts are used.
