# The Data & AI Stack — blog

A fast, SEO-first blog for long-form research on the end-to-end data & AI stack.
Built with **Astro 7**, hosted **free** on **Cloudflare Workers** (static assets), deployed automatically from **GitHub**.

## Tech stack (and why)

| Piece | Choice | Why |
|---|---|---|
| Framework | [Astro 7](https://astro.build) | Ships zero JS by default → near-perfect Core Web Vitals, which Google rewards. Markdown/MDX-native. |
| Content | Markdown / MDX in `src/content/blog` | Write in any editor, version-controlled, embed diagrams and callouts. |
| Search | [Pagefind](https://pagefind.app) | Full-text search that runs in the browser — no server, no cost. `Ctrl K` or `/`. |
| Hosting | Cloudflare Workers static assets | Free plan, global CDN, static requests are free & unmetered, custom domain + HTTPS. |
| CI/CD | GitHub → Cloudflare Workers Builds | `git push` = live in ~1 minute. |
| SEO | sitemap, RSS, canonical URLs, Open Graph/Twitter cards, JSON-LD `BlogPosting`, robots.txt | Everything search engines and social networks look for. |
| Analytics (optional) | Cloudflare Web Analytics | Free, cookie-less, privacy-friendly. |
| Comments (optional) | Giscus (GitHub Discussions) | Free, no ads, no tracking. |
| Newsletter (optional) | Buttondown / Beehiiv / Substack form | Paste the form URL into `src/config.ts`. |

**UX features:** light/dark mode, reading-progress bar, sticky table of contents with scroll-spy, series navigation, reading time,
related posts, previous/next, share buttons, copy-code buttons, click-to-expand diagrams, responsive down to phones, accessible (skip link, focus states, reduced motion).

---

## 1. Run it on your computer

Requires **Node.js 22.12+** (download the LTS from https://nodejs.org).

```powershell
cd "C:\Projects\Data & AI Content\data-ai-stack-blog"
npm install
npm run dev          # http://localhost:4321 — live reload while you write
```

To test the production build (including search):

```powershell
npm run build
npm run preview
```

## 2. Publish to the internet (free) — one-time setup

### a) Push to GitHub
1. Create a new **public or private** repo on GitHub, e.g. `data-ai-stack-blog` (no README).
2. In the project folder:
   ```powershell
   git init
   git add .
   git commit -m "Launch: Data & AI Stack blog"
   git branch -M main
   git remote add origin https://github.com/<your-username>/data-ai-stack-blog.git
   git push -u origin main
   ```

### b) Connect Cloudflare
1. Create a free account at https://dash.cloudflare.com.
2. Go to **Workers & Pages → Create → Import a repository** and pick your GitHub repo.
3. Settings:
   - **Build command:** `npm run build`
   - **Deploy command:** `npx wrangler deploy`
   - (Environment variable, if asked) `NODE_VERSION` = `22`
4. Click **Deploy**. You'll get a URL like `https://data-ai-stack.<your-subdomain>.workers.dev`.
5. Put that URL (or your custom domain) into `url` in **`src/config.ts`**, commit and push. This makes canonical URLs, sitemap and social cards correct.

> Prefer Cloudflare **Pages**? It also works: build command `npm run build`, output directory `dist`. Cloudflare now recommends Workers for new projects, which is why this repo includes `wrangler.jsonc`.

### c) Custom domain (optional, ~$10/year)
Buy a domain (Cloudflare Registrar sells at cost), then **Workers → your worker → Settings → Domains & Routes → Add custom domain**. Update `url` in `src/config.ts`.

From now on: **every `git push` to `main` publishes automatically.**

## 3. Writing a new article

```powershell
npm run new -- "Warehouse vs Lake vs Lakehouse: A Decision Guide" --series data-architecture --part 2 --tags data-architecture,lakehouse
```

This creates `src/content/blog/warehouse-vs-lake-vs-lakehouse-a-decision-guide.mdx` with `draft: true`.
Write it, preview with `npm run dev`, then set `draft: false` and push.

**Frontmatter reference**

```yaml
title: 'Title (≤ 60 chars is best for Google)'
description: '150–160 characters; shown in Google and on social cards'
pubDate: 2026-10-09
updatedDate: 2026-11-01      # optional — shows "Updated" and helps SEO freshness
tags: [data-architecture, lakehouse]
series: data-architecture    # optional
seriesOrder: 2               # part number in src/series.ts
featured: true               # optional — pins to the home page hero card
ogImage: /og/my-post.png     # optional 1200×630 social image in /public
draft: false
```

**Components you can use in `.mdx`:**

```mdx
import Callout from '../../components/mdx/Callout.astro';

<Callout type="tip">…</Callout>     <!-- tip | note | warn | key -->
```

Diagrams live in `src/components/diagrams/` as themed inline SVG (they adapt to dark mode and can be expanded).

**Series roadmaps** live in `src/series.ts` — edit titles, add parts, add new series. Published posts attach automatically by `series` + `seriesOrder`.

## 4. Project map

```
src/
  config.ts                 ← site name, URL, author, socials, analytics, newsletter, comments
  series.ts                 ← series roadmaps
  content/blog/             ← your articles (.md / .mdx)
  components/               ← Header, Footer, Search, PostCard, Newsletter, mdx/, diagrams/
  layouts/                  ← BaseLayout (SEO + shell), PostLayout (article UX)
  pages/                    ← home, /blog, /blog/[slug], /series, /tags, /about, rss.xml, robots.txt
  styles/global.css         ← design tokens (colors, fonts) + article typography
public/                     ← favicon, og images, _headers
wrangler.jsonc              ← Cloudflare Workers config
```

## 5. Growing traffic — a practical playbook

**On-site SEO (already built in)** — fast static pages, semantic HTML, sitemap, RSS, canonical URLs, JSON-LD, Open Graph cards.

**Do once after launch**
1. **Google Search Console** → add your site → submit `https://<your-site>/sitemap-index.xml`.
2. **Bing Webmaster Tools** → import from Search Console (also feeds DuckDuckGo, ChatGPT search, Copilot).
3. Turn on **Cloudflare Web Analytics** and paste the token into `src/config.ts`.
4. Set up a newsletter (Buttondown/Beehiiv free tiers) and paste the form URL into `src/config.ts` — email is the most reliable traffic you own.

**Every article**
- Target one clear search intent per post; put the main phrase in the title, description, first paragraph and one H2.
- Write the "definitive" version: diagrams, comparison tables, decision frameworks, references. Deep content earns links.
- Link internally: each new post should link to 2–3 older ones (and update older ones to link forward).
- Refresh `updatedDate` when you revise.

**Distribution (where data & AI readers are)**
- **LinkedIn**: native post with the key diagram + 5 takeaways, link in the first comment. Your strongest channel for this niche.
- **Cross-post to Medium / dev.to / Hashnode** with the canonical URL pointing to your site (so Google credits you).
- Communities: r/dataengineering, the dbt / Locally Optimistic / DataTalks.Club Slacks, Hacker News (for the deepest pieces), relevant newsletters (Data Engineering Weekly, etc.).
- Turn each pillar post into a LinkedIn carousel and a short thread; reuse the diagrams.
- Publish on a steady cadence (e.g. every other Tuesday). Consistency beats bursts.
