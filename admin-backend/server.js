try { require('dotenv').config(); } catch(e) {}

const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const auth = require('./auth');
const db = require('./db');
const { importArticles } = require('./importer');

// Import existing MD articles into DB on startup (safe to repeat — skips duplicates)
importArticles();

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

// Protected routes
app.use('/admin/articles', auth, require('./routes/articles'));
app.use('/admin/shop', auth, require('./routes/shop'));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Admin CMS → http://localhost:${PORT}/admin`));
