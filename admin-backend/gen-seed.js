// Generates articles-seed.json from src/articles/**/*.md.
// Run this from the repo root whenever you want to refresh the seed
// that the admin DB imports on first boot:  node admin-backend/gen-seed.js

const fs = require('fs');
const path = require('path');

const ARTICLES_ROOT = path.join(__dirname, '../src/articles');
const SECTIONS = ['reviews', 'bikes', 'culture', 'how-to'];
const OUT = path.join(__dirname, 'articles-seed.json');

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return null;
  const raw = match[1];
  const body = match[2].trim();
  const data = {};
  const lines = raw.split('\n');
  let inTags = false;
  const tags = [];
  for (const line of lines) {
    if (inTags) {
      const tagMatch = line.match(/^\s+-\s+(.+)/);
      if (tagMatch) { tags.push(tagMatch[1].trim()); continue; }
      inTags = false;
    }
    const kv = line.match(/^(\w[\w-]*):\s*"?([^"]*)"?\s*$/);
    if (kv) {
      const key = kv[1];
      const val = kv[2].trim();
      if (key === 'tags') { inTags = true; continue; }
      data[key] = val;
    }
  }
  data.tags = tags.join(', ');
  data.body = body;
  return data;
}

const out = [];
for (const section of SECTIONS) {
  const dir = path.join(ARTICLES_ROOT, section);
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.md'))) {
    const slug = file.replace('.md', '');
    const data = parseFrontmatter(fs.readFileSync(path.join(dir, file), 'utf8'));
    if (!data) continue;
    out.push({
      slug, section,
      title: data.title || slug,
      description: data.description || '',
      image: data.image || '',
      body: data.body || '',
      tags: data.tags || section,
      date: data.date || ''
    });
  }
}

fs.writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');
console.log(`Wrote ${out.length} articles to ${OUT}`);
