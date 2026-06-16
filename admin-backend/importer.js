// Imports existing articles into the SQLite DB.
// Primary source: bundled articles-seed.json (always present on Railway).
// Fallbacks: local filesystem (full repo), then GitHub API.
// Safe to run multiple times — skips articles already in DB by slug.

const fs = require('fs');
const path = require('path');
const db = require('./db');

const ARTICLES_ROOT = path.join(__dirname, '../src/articles');
const SEED_FILE = path.join(__dirname, 'articles-seed.json');
const SECTIONS = ['reviews', 'bikes', 'culture', 'how-to'];

function upsert(a) {
  const exists = db.prepare('SELECT id FROM articles WHERE slug=?').get(a.slug);
  if (exists) return false;
  const now = a.date ? new Date(a.date).toISOString() : new Date().toISOString();
  db.prepare(`INSERT OR IGNORE INTO articles
    (title, slug, section, description, image, body, tags, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'published', ?, ?)`)
    .run(a.title || a.slug, a.slug, a.section, a.description || '',
         a.image || '', a.body || '', a.tags || a.section, now, now);
  return true;
}

function importFromSeed() {
  if (!fs.existsSync(SEED_FILE)) return null;
  let seed;
  try { seed = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8')); }
  catch (e) { console.error('[importer] seed parse failed:', e.message); return null; }
  let imported = 0, skipped = 0;
  for (const a of seed) { if (upsert(a)) imported++; else skipped++; }
  return { imported, skipped, source: 'seed' };
}

async function importArticles() {
  let result = importFromSeed();
  if (!result) result = { imported: 0, skipped: 0, source: 'none' };
  console.log(`[importer] Done — source: ${result.source}, imported: ${result.imported}, skipped: ${result.skipped}`);
  return result;
}

module.exports = { importArticles };
