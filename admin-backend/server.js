try { require('dotenv').config(); } catch(e) {}

const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const auth = require('./auth');
const db = require('./db');
const { importArticles } = require('./importer');

// Import existing MD articles into DB on startup (safe to repeat — skips duplicates)
importArticles().catch(e => console.error('[importer] startup failed:', e.message));

const app = express();

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, '../src/img/uploads')));

// Auth (no middleware required)
app.use('/admin', require('./routes/auth'));

// Dashboard
app.get('/admin', auth, (req, res) => res.redirect('/admin/dashboard'));
app.get('/admin/dashboard', auth, (req, res) => {
  const count = (s) => db.prepare('SELECT COUNT(*) as n FROM articles WHERE section=?').get(s).n;
  const shopCount = db.prepare('SELECT COUNT(*) as n FROM shop').get().n;
  const tpl = fs.readFileSync(path.join(__dirname, 'views/dashboard.html'), 'utf8');
  res.send(tpl
    .replace('{{COUNT_REVIEWS}}', count('reviews'))
    .replace('{{COUNT_BIKES}}', count('bikes'))
    .replace('{{COUNT_CULTURE}}', count('culture'))
    .replace('{{COUNT_HOWTO}}', count('how-to'))
    .replace('{{COUNT_SHOP}}', shopCount));
});

// Manual sync trigger — re-runs importer to pull articles into DB
app.post('/admin/sync', auth, async (req, res) => {
  try { await importArticles(); } catch (e) { console.error('[sync] failed:', e.message); }
  res.redirect('/admin/dashboard');
});

// Debug — confirms seed file presence and DB state (auth-protected)
app.get('/admin/debug-seed', auth, (req, res) => {
  const seedFile = path.join(__dirname, 'articles-seed.json');
  const info = {
    __dirname,
    seedFile,
    seedExists: fs.existsSync(seedFile),
    seedCount: null,
    dbCount: null,
    error: null,
  };
  try {
    if (info.seedExists) info.seedCount = JSON.parse(fs.readFileSync(seedFile, 'utf8')).length;
    info.dbCount = db.prepare('SELECT COUNT(*) as n FROM articles').get().n;
  } catch (e) { info.error = e.message; }
  res.json(info);
});

// Debug — force a sync via GET (easier to hit in browser) and report result
app.get('/admin/debug-sync', auth, async (req, res) => {
  try {
    const result = await importArticles();
    const dbCount = db.prepare('SELECT COUNT(*) as n FROM articles').get().n;
    res.json({ ok: true, result, dbCount });
  } catch (e) {
    res.json({ ok: false, error: e.message, stack: e.stack });
  }
});

// Protected routes
app.use('/admin/articles', auth, require('./routes/articles'));
app.use('/admin/shop', auth, require('./routes/shop'));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Admin CMS → http://localhost:${PORT}/admin`));
