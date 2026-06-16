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

// Debug — shows what paths Railway sees
app.get('/admin/debug-paths', auth, (req, res) => {
  const fs = require('fs');
  const articlesRoot = path.join(__dirname, '../src/articles');
  let info = { __dirname, articlesRoot, exists: fs.existsSync(articlesRoot), sections: {} };
  if (info.exists) {
    for (const s of ['reviews','bikes','culture','how-to']) {
      const d = path.join(articlesRoot, s);
      info.sections[s] = fs.existsSync(d) ? fs.readdirSync(d).length + ' files' : 'missing';
    }
  }
  res.json(info);
});

// Protected routes
app.use('/admin/articles', auth, require('./routes/articles'));
app.use('/admin/shop', auth, require('./routes/shop'));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Admin CMS → http://localhost:${PORT}/admin`));
