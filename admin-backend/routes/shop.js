const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const auth = require('../auth');
const db = require('../db');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../src/img/uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g,'-'))
});
const upload = multer({ storage, limits: { fileSize: 10*1024*1024 } });

function readTpl(name) { return fs.readFileSync(path.join(__dirname,'../views',name),'utf8'); }

function syncShopJson() {
  const items = db.prepare('SELECT * FROM shop WHERE status="active" ORDER BY id DESC').all();
  const data = items.map(p => ({
    id: p.id, name: p.name, category: p.category, type: p.type,
    affiliateUrl: p.affiliate_url, asin: p.asin, price: p.price,
    description: p.description, verdict: p.verdict, image: p.image, ownUrl: p.own_url
  }));
  const fp = path.join(__dirname,'../../src/_data/shop.json');
  fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
}

router.get('/admin/shop', auth, (req, res) => {
  const products = db.prepare('SELECT * FROM shop ORDER BY created_at DESC').all();
  const rows = products.map(p => `<tr>
    <td>${p.name}</td><td>${p.category}</td>
    <td><span class="type-badge ${p.type}">${p.type}</span></td>
    <td><span class="badge ${p.status}">${p.status}</span></td>
    <td>
      <a href="/admin/shop/${p.id}/edit" class="btn-sm">Edit</a>
      <form method="POST" action="/admin/shop/${p.id}/delete" style="display:inline" onsubmit="return confirm('Delete?')">
        <button class="btn-sm danger">Delete</button>
      </form>
    </td></tr>`).join('');
  res.send(readTpl('shop-list.html')
    .replace('{{ROWS}}', rows || '<tr><td colspan="5" style="color:#666;text-align:center;padding:2rem">No products yet</td></tr>'));
});

router.get('/admin/shop/new', auth, (req, res) => {
  res.send(readTpl('shop-form.html')
    .replace('{{FORM_TITLE}}','New Product').replace('{{ACTION}}','/admin/shop/new')
    .replace(/\{\{VAL_([A-Z_]+)\}\}/g, '').replace('{{STATUS_ACTIVE}}','selected').replace('{{STATUS_INACTIVE}}','')
    .replace('{{TYPE_AMAZON}}','selected').replace('{{TYPE_ALIEXPRESS}}','').replace('{{TYPE_OWN}}',''));
});

router.post('/admin/shop/new', auth, upload.single('imageFile'), (req, res) => {
  const { name, category, type, affiliateUrl, asin, price, description, verdict, imageUrl, ownUrl, status } = req.body;
  const image = req.file ? '/img/uploads/'+req.file.filename : (imageUrl||'');
  const now = new Date().toISOString();
  db.prepare(`INSERT INTO shop (name,category,type,asin,affiliate_url,price,description,verdict,image,own_url,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(name,category,type,asin||'',affiliateUrl||'',price||'',description||'',verdict||'',image,ownUrl||'',status||'active',now,now);
  syncShopJson();
  res.redirect('/admin/shop');
});

router.get('/admin/shop/:id/edit', auth, (req, res) => {
  const p = db.prepare('SELECT * FROM shop WHERE id=?').get(req.params.id);
  if (!p) return res.redirect('/admin/shop');
  res.send(readTpl('shop-form.html')
    .replace('{{FORM_TITLE}}','Edit Product').replace('{{ACTION}}',`/admin/shop/${p.id}/edit`)
    .replace('{{VAL_NAME}}', p.name||'').replace('{{VAL_CATEGORY}}', p.category||'')
    .replace('{{VAL_ASIN}}', p.asin||'').replace('{{VAL_AFFILIATE_URL}}', p.affiliate_url||'')
    .replace('{{VAL_PRICE}}', p.price||'').replace('{{VAL_DESCRIPTION}}', p.description||'')
    .replace('{{VAL_VERDICT}}', p.verdict||'').replace('{{VAL_IMAGE}}', p.image||'')
    .replace('{{VAL_OWN_URL}}', p.own_url||'')
    .replace('{{STATUS_ACTIVE}}', p.status==='active'?'selected':'').replace('{{STATUS_INACTIVE}}', p.status==='inactive'?'selected':'')
    .replace('{{TYPE_AMAZON}}', p.type==='amazon'?'selected':'').replace('{{TYPE_ALIEXPRESS}}', p.type==='aliexpress'?'selected':'').replace('{{TYPE_OWN}}', p.type==='own'?'selected':''));
});

router.post('/admin/shop/:id/edit', auth, upload.single('imageFile'), (req, res) => {
  const p = db.prepare('SELECT * FROM shop WHERE id=?').get(req.params.id);
  if (!p) return res.redirect('/admin/shop');
  const { name, category, type, affiliateUrl, asin, price, description, verdict, imageUrl, ownUrl, status } = req.body;
  const image = req.file ? '/img/uploads/'+req.file.filename : (imageUrl||p.image);
  const now = new Date().toISOString();
  db.prepare(`UPDATE shop SET name=?,category=?,type=?,asin=?,affiliate_url=?,price=?,description=?,verdict=?,image=?,own_url=?,status=?,updated_at=? WHERE id=?`)
    .run(name,category,type,asin||'',affiliateUrl||'',price||'',description||'',verdict||'',image,ownUrl||'',status||'active',now,p.id);
  syncShopJson();
  res.redirect('/admin/shop');
});

router.post('/admin/shop/:id/delete', auth, (req, res) => {
  db.prepare('DELETE FROM shop WHERE id=?').run(req.params.id);
  syncShopJson();
  res.redirect('/admin/shop');
});

module.exports = router;
