const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../db');
const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '../../src/img/uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).toLowerCase().replace(/[^a-z0-9]/g, '-');
    cb(null, `${base}-${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

const SHOP_JSON = path.join(__dirname, '../../src/_data/shop.json');

function syncShopJson() {
  const products = db.prepare('SELECT * FROM shop ORDER BY id').all();
  const data = products.map(p => ({
    id: p.id, name: p.name, category: p.category, type: p.type,
    affiliateUrl: p.affiliate_url, asin: p.asin, price: p.price,
    description: p.description, verdict: p.verdict, image: p.image,
    ownUrl: p.own_url, status: p.status
  }));
  fs.mkdirSync(path.dirname(SHOP_JSON), { recursive: true });
  fs.writeFileSync(SHOP_JSON, JSON.stringify(data, null, 2));
}

function readView(name) { return fs.readFileSync(path.join(__dirname, '../views', name), 'utf8'); }

function fillProductForm(tpl, values) {
  return Object.entries(values).reduce((h, [k, v]) => h.split(k).join(v != null ? String(v) : ''), tpl);
}

function typeOpts(selected) { return selected || 'amazon'; }

// GET /admin/shop
router.get('/', (req, res) => {
  const products = db.prepare('SELECT * FROM shop ORDER BY id DESC').all();
  const rows = products.length ? products.map(p => `<tr>
    <td>${p.name}</td>
    <td>${p.category || ''}</td>
    <td style="text-transform:capitalize">${p.type || ''}</td>
    <td>${p.price ? '$' + p.price : '—'}</td>
    <td><span class="badge ${p.status}">${p.status}</span></td>
    <td>
      <a href="/admin/shop/${p.id}/edit" class="btn-sm">Edit</a>
      <form method="POST" action="/admin/shop/${p.id}/delete" style="display:inline" onsubmit="return confirm('Delete?')">
        <button type="submit" class="btn-sm danger">Delete</button>
      </form>
    </td></tr>`).join('') : '<tr><td colspan="6" style="color:#666;text-align:center;padding:2rem">No products yet</td></tr>';
  res.send(readView('shop-list.html').replace('{{SHOP_ROWS}}', rows));
});

// GET /admin/shop/new
router.get('/new', (req, res) => {
  res.send(fillProductForm(readView('shop-form.html'), {
    '{{FORM_ACTION}}': '/admin/shop', '{{FORM_TITLE}}': 'New Product',
    '{{NAME}}': '', '{{CATEGORY}}': '', '{{CURRENT_TYPE}}': typeOpts('amazon'),
    '{{ASIN}}': '', '{{AFFILIATE_URL}}': '', '{{OWN_URL}}': '',
    '{{PRICE}}': '', '{{DESCRIPTION}}': '', '{{VERDICT}}': '', '{{IMAGE}}': '',
    '{{STATUS_ACTIVE}}': 'selected', '{{STATUS_INACTIVE}}': ''
  }));
});

// POST /admin/shop
router.post('/', upload.single('imageFile'), (req, res) => {
  const { name, category, type, asin, affiliate_url, own_url, price, description, verdict, imageUrl, status } = req.body;
  const image = req.file ? '/img/uploads/' + req.file.filename : (imageUrl || '');
  const now = new Date().toISOString();
  db.prepare('INSERT INTO shop (name,category,type,asin,affiliate_url,own_url,price,description,verdict,image,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)')
    .run(name, category, type, asin || '', affiliate_url || '', own_url || '', price || '', description || '', verdict || '', image, status || 'active', now, now);
  syncShopJson();
  res.redirect('/admin/shop');
});

// GET /admin/shop/:id/edit
router.get('/:id/edit', (req, res) => {
  const p = db.prepare('SELECT * FROM shop WHERE id=?').get(req.params.id);
  if (!p) return res.redirect('/admin/shop');
  res.send(fillProductForm(readView('shop-form.html'), {
    '{{FORM_ACTION}}': `/admin/shop/${p.id}/edit`, '{{FORM_TITLE}}': 'Edit Product',
    '{{NAME}}': p.name || '', '{{CATEGORY}}': p.category || '', '{{CURRENT_TYPE}}': typeOpts(p.type),
    '{{ASIN}}': p.asin || '', '{{AFFILIATE_URL}}': p.affiliate_url || '', '{{OWN_URL}}': p.own_url || '',
    '{{PRICE}}': p.price || '', '{{DESCRIPTION}}': p.description || '',
    '{{VERDICT}}': p.verdict || '', '{{IMAGE}}': p.image || '',
    '{{STATUS_ACTIVE}}': p.status === 'active' ? 'selected' : '',
    '{{STATUS_INACTIVE}}': p.status === 'inactive' ? 'selected' : ''
  }));
});

// POST /admin/shop/:id/edit
router.post('/:id/edit', upload.single('imageFile'), (req, res) => {
  const p = db.prepare('SELECT * FROM shop WHERE id=?').get(req.params.id);
  if (!p) return res.redirect('/admin/shop');
  const { name, category, type, asin, affiliate_url, own_url, price, description, verdict, imageUrl, status } = req.body;
  const image = req.file ? '/img/uploads/' + req.file.filename : (imageUrl || p.image);
  db.prepare('UPDATE shop SET name=?,category=?,type=?,asin=?,affiliate_url=?,own_url=?,price=?,description=?,verdict=?,image=?,status=?,updated_at=? WHERE id=?')
    .run(name, category, type, asin || '', affiliate_url || '', own_url || '', price || '', description || '', verdict || '', image, status || 'active', new Date().toISOString(), p.id);
  syncShopJson();
  res.redirect('/admin/shop');
});

// POST /admin/shop/:id/delete
router.post('/:id/delete', (req, res) => {
  db.prepare('DELETE FROM shop WHERE id=?').run(req.params.id);
  syncShopJson();
  res.redirect('/admin/shop');
});

module.exports = router;
