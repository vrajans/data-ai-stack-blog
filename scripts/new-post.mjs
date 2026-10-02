// Create a new article:  npm run new -- "My Article Title"
// Optional flags: --series data-architecture --part 2 --tags lakehouse,iceberg
import { writeFileSync, existsSync } from 'node:fs';

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const title = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
if (!title) {
  console.error('Usage: npm run new -- "My Article Title" [--series data-architecture --part 2 --tags a,b]');
  process.exit(1);
}
const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const file = `src/content/blog/${slug}.mdx`;
if (existsSync(file)) {
  console.error(`Already exists: ${file}`);
  process.exit(1);
}
const today = new Date().toISOString().slice(0, 10);
const tags = (flag('tags') ?? 'data-architecture').split(',').map((t) => t.trim()).filter(Boolean);
const series = flag('series');
const part = flag('part');

const fm = [
  '---',
  `title: '${title.replace(/'/g, "''")}'`,
  `description: 'One or two sentences that make people want to click. Shown in search results and social cards.'`,
  `pubDate: ${today}`,
  `tags: [${tags.join(', ')}]`,
  series ? `series: ${series}` : null,
  series && part ? `seriesOrder: ${part}` : null,
  'draft: true',
  '---',
].filter(Boolean).join('\n');

const body = `
import Callout from '../../components/mdx/Callout.astro';

Open with the problem the reader has, and what they'll be able to do after reading.

## First section

Write here. Use **bold**, \`code\`, tables and lists freely.

<Callout type="key">
One sentence the reader should remember.
</Callout>

## Key takeaways

- ...

## References and further reading

- [Source title](https://example.com)
`;

writeFileSync(file, fm + '\n' + body);
console.log(`✓ Created ${file}  (draft: true — set to false when ready to publish)`);
