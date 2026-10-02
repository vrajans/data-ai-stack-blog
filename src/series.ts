// Series roadmaps. Published posts attach via frontmatter:
//   series: data-architecture
//   seriesOrder: 2      ← matches the part number below (1-based)
// Parts without a published post show as "Coming soon".

export interface SeriesDef {
  slug: string;
  title: string;
  description: string;
  parts: { title: string; summary: string }[];
}

export const SERIES: SeriesDef[] = [
  {
    slug: 'data-architecture',
    title: 'Data Architecture',
    description:
      'From first principles to reference architectures: how modern data platforms are designed, why they look the way they do, and how to make the big decisions.',
    parts: [
      { title: 'Data Architecture: The Complete Guide', summary: 'The pillar article — layers, patterns, principles and a decision framework.' },
      { title: 'Warehouse vs Lake vs Lakehouse: A Decision Guide', summary: 'Four decades of evolution, the real trade-offs, and when each still wins.' },
      { title: 'Open Table Formats Deep Dive: Iceberg, Delta, Hudi & DuckLake', summary: 'Snapshots, manifests, deletion vectors, row lineage — how ACID works on object storage.' },
      { title: 'Catalogs: The Metadata Control Plane', summary: 'Iceberg REST, Apache Polaris, Unity Catalog, Glue and S3 Tables — and why the catalog now matters more than the format.' },
      { title: 'Data Modeling for the Modern Stack', summary: 'Kimball, Data Vault 2.0, One Big Table, medallion layers and activity schemas compared.' },
      { title: 'Batch, Streaming & Real-Time Architectures', summary: 'Lambda, Kappa, streaming lakehouse, CDC and the latency/cost/complexity triangle.' },
      { title: 'Data Mesh & Data Fabric in Practice', summary: 'Domain ownership, data products, federated governance — what worked and what did not.' },
      { title: 'Reference Architectures: AWS, Azure, GCP, Databricks & Snowflake', summary: 'The same blueprint mapped onto each platform, with the gotchas.' },
      { title: 'Designing AI-Ready Data Architecture', summary: 'Unstructured data, vector search, semantic layers, context for agents and governance for AI.' },
      { title: 'Cost, Performance & FinOps for Data Platforms', summary: 'Where the money goes, and the architectural levers that actually reduce it.' },
    ],
  },
  {
    slug: 'data-engineering',
    title: 'Data Engineering',
    description: 'Moving and shaping data reliably: ingestion, CDC, streaming, orchestration, transformation and testing.',
    parts: [
      { title: 'Ingestion Patterns: Batch, Micro-batch, CDC & Events', summary: 'How data enters the platform, and the failure modes of each approach.' },
      { title: 'Streaming Foundations: Kafka, Flink & Friends', summary: 'Logs, partitions, exactly-once and stateful stream processing.' },
      { title: 'Orchestration: Airflow, Dagster & Beyond', summary: 'Task- vs asset-based orchestration and designing for backfills.' },
      { title: 'Transformation with SQL: dbt, SQLMesh & Idempotent Pipelines', summary: 'Modular SQL, incremental models and CI for data.' },
    ],
  },
  {
    slug: 'data-governance',
    title: 'Governance, Quality & Observability',
    description: 'Trust at scale: catalogs, lineage, data contracts, access control, privacy and observability.',
    parts: [
      { title: 'Data Contracts: Shifting Quality Left', summary: 'Schemas, SLAs and ownership between producers and consumers.' },
      { title: 'Lineage & Metadata with OpenLineage', summary: 'Column-level lineage and why it pays for itself during incidents.' },
      { title: 'Access Control, Privacy & Compliance', summary: 'RBAC, ABAC, masking, row filters and PII handling.' },
      { title: 'Data Observability', summary: 'Freshness, volume, schema, distribution and lineage-aware alerting.' },
    ],
  },
  {
    slug: 'analytics',
    title: 'Analytics & Semantic Layers',
    description: 'Turning data into decisions: modeling for BI, metrics layers and self-service that scales.',
    parts: [
      { title: 'The Semantic Layer Explained', summary: 'Metrics as code, and why it is becoming the interface for AI agents too.' },
      { title: 'Designing for Self-Service BI', summary: 'Certified datasets, governance and performance.' },
    ],
  },
  {
    slug: 'machine-learning',
    title: 'Machine Learning Systems',
    description: 'The platform side of ML: features, training pipelines, model registries, serving and monitoring.',
    parts: [
      { title: 'Feature Stores & Training Data', summary: 'Point-in-time correctness and online/offline consistency.' },
      { title: 'MLOps End to End', summary: 'Experiment tracking, registries, CI/CD for models and drift monitoring.' },
    ],
  },
  {
    slug: 'generative-ai',
    title: 'Generative AI & Agents',
    description: 'Building reliable LLM applications on top of a solid data foundation: RAG, evaluation, LLMOps and agents.',
    parts: [
      { title: 'RAG Architecture Deep Dive', summary: 'Chunking, embeddings, hybrid retrieval, re-ranking and evaluation.' },
      { title: 'Vector Databases vs Vector Search in Your Lakehouse', summary: 'When you need a dedicated store — and when you do not.' },
      { title: 'LLMOps: Evaluation, Guardrails & Observability', summary: 'Shipping LLM features you can trust.' },
      { title: 'Agentic Systems & the Data Platform', summary: 'Tools, MCP, context engineering and governing agent access to data.' },
    ],
  },
];
