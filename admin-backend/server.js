const fs = require('fs');
const path = require('path');

// Manually load .env file
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) return;
    const key = line.substring(0, eqIdx).trim();
    const value = line.substring(eqIdx + 1).trim();
    if (key && !(key in process.env)) {
      process.env[key] = value;
    }
  });
}

const express = require('express');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const auth = require('./auth');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

// Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../src/img/uploads/');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-');
    cb(null, `${base}-${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

// Middleware
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static uploads
app.use('/img/uploads', express.static(path.join(__dirname, '../src/img/uploads/')));

// Upload endpoint
app.post('/admin/upload', auth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ url: `/img/uploads/${req.file.filename}` });
});

// Auth routes
const authRoutes = require('./routes/auth');
app.use(authRoutes);

// Articles routes with multer injected before the POST handlers
const articlesRouter = require('./routes/articles');
app.post('/admin/articles', upload.single('image'));
app.post('/admin/articles/:id/edit', upload.single('image'));
app.use(articlesRouter);

// Shop routes with multer injected
const shopRouter = require('./routes/shop');
app.post('/admin/shop', upload.single('image'));
app.post('/admin/shop/:id/edit', upload.single('image'));
app.use(shopRouter);

// Dashboard
app.get('/admin', auth, (req, res) => {
  const sections = ['reviews', 'bikes', 'culture', 'how-to'];
  const sectionCounts = sections.map(section => {
    const row = db.prepare('SELECT COUNT(*) as count FROM articles WHERE section = ?').get(section);
    return { section, count: row ? row.count : 0 };
  });
  const totalArticles = db.prepare('SELECT COUNT(*) as count FROM articles').get();
  const shopCount = db.prepare('SELECT COUNT(*) as count FROM shop').get();
  const publishedCount = db.prepare("SELECT COUNT(*) as count FROM articles WHERE status = 'published'").get();

  let statsHtml = `
    <div class="stat-card">
      <div class="stat-label">Total Articles</div>
      <div class="stat-number">${totalArticles ? totalArticles.count : 0}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Published</div>
      <div class="stat-number">${publishedCount ? publishedCount.count : 0}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Shop Products</div>
      <div class="stat-number">${shopCount ? shopCount.count : 0}</div>
    </div>
  `;

  sectionCounts.forEach(s => {
    statsHtml += `
    <div class="stat-card">
      <div class="stat-label">${s.section.charAt(0).toUpperCase() + s.section.slice(1)}</div>
      <div class="stat-number">${s.count}</div>
    </div>`;
  });

  let html = fs.readFileSync(path.join(__dirname, 'views/dashboard.html'), 'utf8');
  html = html.replace('{{STATS_HTML}}', statsHtml);
  res.send(html);
});

app.get('/', (req, res) => res.redirect('/admin'));

app.listen(PORT, () => {
  console.log(`BikeLabs Admin running at http://localhost:${PORT}`);
});
