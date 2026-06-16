// Imports existing src/articles/**/*.md files into the SQLite DB.
// Safe to run multiple times — skips articles already in DB by slug.

const fs = require('fs');
const path = require('path');
const db = require('./db');

const ARTICLES_ROOT = path.join(__dirname, '../src/articles');
const SECTIONS = ['reviews', 'bikes', 'culture', 'how-to'];

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return null;
  const raw = match[1];
  const body = match[2].trim();
  const data = {};

  // Parse simple key: value lines and multi-line tags arrays
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

function importArticles() {
  let imported = 0;
  let skipped = 0;

  for (const section of SECTIONS) {
    const dir = path.join(ARTICLES_ROOT, section);
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const slug = file.replace('.md', '');

      // Skip if already in DB
      const exists = db.prepare('SELECT id FROM articles WHERE slug=?').get(slug);
      if (exists) { skipped++; continue; }

      const content = fs.readFileSync(path.join(dir, file), 'utf8');
      const data = parseFrontmatter(content);
      if (!data) { skipped++; continue; }

      const now = data.date ? new Date(data.date).toISOString() : new Date().toISOString();
      db.prepare(`INSERT OR IGNORE INTO articles
        (title, slug, section, description, image, body, tags, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'published', ?, ?)`)
        .run(
          data.title || slug,
          slug,
          section,
          data.description || '',
          data.image || '',
          data.body || '',
          data.tags || section,
          now,
          now
        );
      imported++;
    }
  }

  if (imported > 0) console.log(`[importer] Imported ${imported} articles from disk.`);
  if (skipped > 0)  console.log(`[importer] Skipped ${skipped} (already in DB or unparseable).`);
}

module.exports = { importArticles };
