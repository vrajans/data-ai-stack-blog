// ─────────────────────────────────────────────────────────────
//  Site-wide settings. Edit this one file to rebrand the blog.
// ─────────────────────────────────────────────────────────────
export const SITE = {
  // After your first deploy, replace with your real URL (or custom domain)
  url: 'https://data-ai-stack.pages.dev',
  title: 'The Data & AI Stack',
  tagline: 'Deep, practical research on the end-to-end data & AI stack.',
  description:
    'Long-form, research-backed guides on data architecture, data engineering, governance, analytics, machine learning and generative AI — from ingestion to agents.',
  author: 'Varatharajan',
  authorBio:
    'Data & AI practitioner writing deep-dive guides on how modern data platforms and AI systems are designed, built and run.',
  locale: 'en-US',
  // Social links (leave '' to hide)
  social: {
    github: 'https://github.com/',
    linkedin: 'https://www.linkedin.com/',
    x: '',
  },
  // Free, privacy-friendly analytics: Cloudflare dashboard → Analytics & Logs → Web Analytics → add site → copy token
  cloudflareAnalyticsToken: '',
  // Free newsletter (Buttondown / Substack / Beehiiv). Paste your form action URL to enable the signup box.
  newsletterAction: '',
  // Free comments via GitHub Discussions (https://giscus.app). Fill all four to enable.
  giscus: { repo: '', repoId: '', category: '', categoryId: '' },
  postsPerPage: 9,
};

// Topic "tracks" shown on the home page. `tag` links to /tags/<tag>.
export const TRACKS = [
  { tag: 'data-architecture', title: 'Data Architecture', icon: '◇', blurb: 'Warehouses, lakes, lakehouses, mesh, fabric and how to choose.' },
  { tag: 'data-engineering', title: 'Data Engineering', icon: '⇄', blurb: 'Ingestion, CDC, streaming, orchestration and transformation.' },
  { tag: 'data-governance', title: 'Governance & Quality', icon: '◎', blurb: 'Catalogs, lineage, contracts, security and observability.' },
  { tag: 'analytics', title: 'Analytics & BI', icon: '▤', blurb: 'Modeling, semantic layers, metrics and self-service.' },
  { tag: 'machine-learning', title: 'Machine Learning', icon: '∿', blurb: 'Feature stores, MLOps, training and serving.' },
  { tag: 'generative-ai', title: 'GenAI & Agents', icon: '✦', blurb: 'RAG, vector search, LLMOps, evaluation and agentic systems.' },
];
