// ─────────────────────────────────────────────────────────────
//  Site-wide settings. Edit this one file to rebrand the blog.
// ─────────────────────────────────────────────────────────────
export const SITE = {
  // After your first deploy, replace with your real URL (or custom domain)
  url: 'https://varath.dev',
  title: 'The Data & AI Stack',
  tagline: 'Deep, practical research on the end-to-end data & AI stack.',
  description:
    'Long-form, research-backed guides on data architecture, data engineering, governance, analytics, machine learning and generative AI — from ingestion to agents.',
  author: 'Varatharajan',
  authorBio:
    'Data & AI practitioner with 17 years of experience designing, building and running data platforms. I write deep-dive guides on how modern data and AI systems really work.',
  // Short credentials shown on the homepage and About page.
  credentials: ['17 years building data platforms', 'Hands-on across AWS, Azure, Google Cloud, Databricks & Snowflake'],
  // Your YouTube brand, shown in the author box, header and footer
  brand: 'Data & AI with Varath',
  locale: 'en-US',
  // Social links (leave '' to hide)
  social: {
    github: 'https://github.com/vrajans',
    linkedin: 'https://www.linkedin.com/in/varatharajan-subramanian-b1651525/',
    youtube: 'https://www.youtube.com/@DataAndAIwithVarath',
    x: '',
  },
  // Free, privacy-friendly analytics: Cloudflare dashboard → Analytics & Logs → Web Analytics → add site → copy token
  cloudflareAnalyticsToken: '',
  // Public contact address (forward it to your inbox with Cloudflare Email Routing — free).
  contactEmail: 'hello@varath.dev',
  // Own email list: subscribers are stored in Cloudflare D1 by the Worker in /worker (double opt-in via Resend).
  // Set enabled: true once the D1 database, secrets and Turnstile are set up (see SETUP-NEWSLETTER.md).
  newsletter: {
    enabled: true,
    endpoint: '/api/subscribe',
    // Cloudflare Turnstile SITE key (public). Dashboard → Turnstile → Add widget → varath.dev → Managed.
    turnstileSiteKey: '0x4AAAAAAF25fBjr4zFoSCZu',
  },
  // Free comments via GitHub Discussions (https://giscus.app). Fill all four to enable.
  giscus: { repo: 'vrajans/data-ai-stack-blog', repoId: 'R_kgDOU4Qoxg', category: 'Comments', categoryId: 'DIC_kwDOU4Qoxs4DKjt8' },
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
