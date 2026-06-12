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
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'))
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const SITE_ROOT = path.join(__dirname, '../../src');
const SECTION_DIRS = { reviews: 'reviews', bikes: 'bikes', culture: 'culture', 'how-to': 'how-to' };

function slugify(t) { return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
function readTpl(name) { return fs.readFileSync(path.join(__dirname, '../views', name), 'utf8'); }

function writeMarkdown(a) {
  const dir = path.join(SITE_ROOT, SECTION_DIRS[a.section] || a.section);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const tags = a.tags ? a.tags.split(',').map(t => t.trim()).filter(Boolean) : [a.section];
  const md = `---
layout: article.njk
title: "${a.title.replace(/"/g, '\\"')}"
description: "${(a.description||'').replace(/"/g,'\\"')}"
image: ${a.image||''}
date: ${a.created_at.split('T')[0]}
section: ${a.section}
tags:\n${tags.map(t=>'  - '+t).join('\n')}
---\n\n${a.body||''}`;
  fs.writeFileSync(path.join(dir, a.slug+'.md'), md, 'utf8');
}

function deleteMarkdown(a) {
  const fp = path.join(SITE_ROOT, SECTION_DIRS[a.section]||a.section, a.slug+'.md');
  if (fs.existsSync(fp)) fs.unlinkSync(fp);
}

router.get('/admin', auth, (req, res) => {
  const counts = {
    reviews: db.prepare("SELECT COUNT(*) as c FROM articles WHERE section='reviews'").get().c,
    bikes: db.prepare("SELECT COUNT(*) as c FROM articles WHERE section='bikes'").get().c,
    culture: db.prepare("SELECT COUNT(*) as c FROM articles WHERE section='culture'").get().c,
    howto: db.prepare("SELECT COUNT(*) as c FROM articles WHERE section='how-to'").get().c,
    shop: db.prepare("SELECT COUNT(*) as c FROM shop").get().c,
  };
  res.send(readTpl('dashboard.html')
    .replace('{{COUNT_REVIEWS}}', counts.reviews)
    .replace('{{COUNT_BIKES}}', counts.bikes)
    .replace('{{COUNT_CULTURE}}', counts.culture)
    .replace('{{COUNT_HOWTO}}', counts.howto)
    .replace('{{COUNT_SHOP}}', counts.shop));
});

router.get('/admin/articles', auth, (req, res) => {
  const articles = db.prepare('SELECT * FROM articles ORDER BY created_at DESC').all();
  const rows = articles.map(a => `<tr>
    <td>${a.title}</td><td>${a.section}</td>
    <td><span class="badge ${a.status}">${a.status}</span></td>
    <td>${a.created_at.split('T')[0]}</td>
    <td>
      <a href="/admin/articles/${a.id}/edit" class="btn-sm">Edit</a>
      <form method="POST" action="/admin/articles/${a.id}/delete" style="display:inline" onsubmit="return confirm('Delete?')">
        <button class="btn-sm danger">Delete</button>
      </form>
    </td></tr>`).join('');
  res.send(readTpl('articles-list.html')
    .replace('{{ROWS}}', rows || '<tr><td colspan="5" style="color:#666;text-align:center;padding:2rem">No articles yet</td></tr>'));
});

router.get('/admin/articles/new', auth, (req, res) => {
  const opts = ['reviews','bikes','culture','how-to'].map(s=>`<option value="${s}">${s}</option>`).join('');
  res.send(readTpl('article-form.html')
    .replace('{{FORM_TITLE}}','New Article').replace('{{ACTION}}','/admin/articles/new')
    .replace('{{TITLE}}','').replace('{{SECTION_OPTIONS}}',opts)
    .replace('{{DESCRIPTION}}','').replace('{{IMAGE}}','').replace('{{TAGS}}','')
    .replace('{{BODY}}','').replace('{{STATUS_DRAFT}}','selected').replace('{{STATUS_PUBLISHED}}',''));
});

router.post('/admin/articles/new', auth, upload.single('imageFile'), (req, res) => {
  const { title, section, description, imageUrl, tags, body, status } = req.body;
  const slug = slugify(title);
  const image = req.file ? '/img/uploads/'+req.file.filename : (imageUrl||'');
  const now = new Date().toISOString();
  db.prepare(`INSERT OR REPLACE INTO articles (title,slug,section,description,image,body,tags,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`)
    .run(title,slug,section,description,image,body,tags,status||'draft',now,now);
  if (status==='published') writeMarkdown({title,slug,section,description,image,body,tags,status,created_at:now});
  res.redirect('/admin/articles');
});

router.get('/admin/articles/:id/edit', auth, (req, res) => {
  const a = db.prepare('SELECT * FROM articles WHERE id=?').get(req.params.id);
  if (!a) return res.redirect('/admin/articles');
  const opts = ['reviews','bikes','culture','how-to'].map(s=>`<option value="${s}" ${a.section===s?'selected':''}>${s}</option>`).join('');
  res.send(readTpl('article-form.html')
    .replace('{{FORM_TITLE}}','Edit Article').replace('{{ACTION}}',`/admin/articles/${a.id}/edit`)
    .replace('{{TITLE}}',a.title||'').replace('{{SECTION_OPTIONS}}',opts)
    .replace('{{DESCRIPTION}}',a.description||'').replace('{{IMAGE}}',a.image||'')
    .replace('{{TAGS}}',a.tags||'').replace('{{BODY}}',(a.body||'').replace(/</g,'&lt;').replace(/>/g,'&gt;'))
    .replace('{{STATUS_DRAFT}}',a.status==='draft'?'selected':'').replace('{{STATUS_PUBLISHED}}',a.status==='published'?'selected':''));
});

router.post('/admin/articles/:id/edit', auth, upload.single('imageFile'), (req, res) => {
  const a = db.prepare('SELECT * FROM articles WHERE id=?').get(req.params.id);
  if (!a) return res.redirect('/admin/articles');
  const { title, section, description, imageUrl, tags, body, status } = req.body;
  const image = req.file ? '/img/uploads/'+req.file.filename : (imageUrl||a.image);
  const now = new Date().toISOString();
  db.prepare(`UPDATE articles SET title=?,section=?,description=?,image=?,body=?,tags=?,status=?,updated_at=? WHERE id=?`)
    .run(title,section,description,image,body,tags,status||'draft',now,a.id);
  deleteMarkdown(a);
  if (status==='published') writeMarkdown({...a,title,section,description,image,body,tags,status});
  res.redirect('/admin/articles');
});

router.post('/admin/articles/:id/delete', auth, (req, res) => {
  const a = db.prepare('SELECT * FROM articles WHERE id=?').get(req.params.id);
  if (a) { deleteMarkdown(a); db.prepare('DELETE FROM articles WHERE id=?').run(a.id); }
  res.redirect('/admin/articles');
});

module.exports = router;
