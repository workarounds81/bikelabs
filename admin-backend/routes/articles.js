const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const multer = require('multer');
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

const REPO_ROOT = path.join(__dirname, '../..');
const ARTICLES_ROOT = path.join(REPO_ROOT, 'src/articles');

function slugify(t) { return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
function readTpl(name) { return fs.readFileSync(path.join(__dirname, '../views', name), 'utf8'); }

function writeMarkdown(a) {
  const dir = path.join(ARTICLES_ROOT, a.section);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const tags = a.tags ? a.tags.split(',').map(t => t.trim()).filter(Boolean) : [a.section];
  const date = (a.created_at || new Date().toISOString()).split('T')[0];
  const layout = a.section === 'culture' ? 'culture.njk' : 'article.njk';
  const permalink = `/${a.section}/${a.slug}/`;
  const md = `---
layout: ${layout}
title: "${a.title.replace(/"/g, '\\"')}"
description: "${(a.description || '').replace(/"/g, '\\"')}"
image: ${a.image || ''}
date: ${date}
section: ${a.section}
permalink: ${permalink}
affiliate: false
tags:
${tags.map(t => '  - ' + t).join('\n')}
---

${a.body || ''}`;
  fs.writeFileSync(path.join(dir, a.slug + '.md'), md, 'utf8');
}

function deleteMarkdown(a) {
  const fp = path.join(ARTICLES_ROOT, a.section, a.slug + '.md');
  if (fs.existsSync(fp)) fs.unlinkSync(fp);
}

function gitPush(message) {
  try {
    execSync(`git -C "${REPO_ROOT}" add src/articles`, { stdio: 'pipe' });
    execSync(`git -C "${REPO_ROOT}" commit -m "${message.replace(/"/g, "'")}" --allow-empty`, { stdio: 'pipe' });
    execSync(`git -C "${REPO_ROOT}" push`, { stdio: 'pipe' });
    return true;
  } catch (e) {
    console.error('Git push failed:', e.message);
    return false;
  }
}

// GET /admin/articles
router.get('/', (req, res) => {
  const articles = db.prepare('SELECT * FROM articles ORDER BY created_at DESC').all();
  const rows = articles.map(a => `<tr>
    <td>${a.title}</td>
    <td style="text-transform:capitalize">${a.section}</td>
    <td><span class="badge ${a.status}">${a.status}</span></td>
    <td>${(a.created_at || '').split('T')[0]}</td>
    <td>
      <a href="/admin/articles/${a.id}/edit" class="btn-sm">Edit</a>
      <form method="POST" action="/admin/articles/${a.id}/delete" style="display:inline" onsubmit="return confirm('Delete this article?')">
        <button class="btn-sm danger">Delete</button>
      </form>
    </td></tr>`).join('');
  res.send(readTpl('articles-list.html')
    .replace('{{ROWS}}', rows || '<tr><td colspan="5" style="color:#666;text-align:center;padding:2rem">No articles yet</td></tr>'));
});

// GET /admin/articles/new
router.get('/new', (req, res) => {
  const opts = ['reviews', 'bikes', 'culture', 'how-to'].map(s => `<option value="${s}">${s}</option>`).join('');
  res.send(readTpl('article-form.html')
    .replace('{{FORM_TITLE}}', 'New Article')
    .replace('{{ACTION}}', '/admin/articles')
    .replace('{{TITLE}}', '')
    .replace('{{SECTION_OPTIONS}}', opts)
    .replace('{{DESCRIPTION}}', '')
    .replace('{{IMAGE}}', '')
    .replace('{{TAGS}}', '')
    .replace('{{BODY}}', '')
    .replace('{{STATUS_DRAFT}}', 'selected')
    .replace('{{STATUS_PUBLISHED}}', ''));
});

// POST /admin/articles
router.post('/', upload.single('imageFile'), (req, res) => {
  const { title, section, description, imageUrl, tags, body, status } = req.body;
  const slug = slugify(title);
  const image = req.file ? '/img/uploads/' + req.file.filename : (imageUrl || '');
  const now = new Date().toISOString();
  db.prepare('INSERT OR REPLACE INTO articles (title,slug,section,description,image,body,tags,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)')
    .run(title, slug, section, description, image, body, tags, status || 'draft', now, now);
  const a = db.prepare('SELECT * FROM articles WHERE slug=?').get(slug);
  if (status === 'published') {
    writeMarkdown(a);
    gitPush(`Publish article: ${title}`);
  }
  res.redirect('/admin/articles');
});

// GET /admin/articles/:id/edit
router.get('/:id/edit', (req, res) => {
  const a = db.prepare('SELECT * FROM articles WHERE id=?').get(req.params.id);
  if (!a) return res.redirect('/admin/articles');
  const opts = ['reviews', 'bikes', 'culture', 'how-to'].map(s =>
    `<option value="${s}"${a.section === s ? ' selected' : ''}>${s}</option>`).join('');
  res.send(readTpl('article-form.html')
    .replace('{{FORM_TITLE}}', 'Edit Article')
    .replace('{{ACTION}}', `/admin/articles/${a.id}/edit`)
    .replace('{{TITLE}}', a.title || '')
    .replace('{{SECTION_OPTIONS}}', opts)
    .replace('{{DESCRIPTION}}', a.description || '')
    .replace('{{IMAGE}}', a.image || '')
    .replace('{{TAGS}}', a.tags || '')
    .replace('{{BODY}}', (a.body || '').replace(/</g, '&lt;').replace(/>/g, '&gt;'))
    .replace('{{STATUS_DRAFT}}', a.status === 'draft' ? 'selected' : '')
    .replace('{{STATUS_PUBLISHED}}', a.status === 'published' ? 'selected' : ''));
});

// POST /admin/articles/:id/edit
router.post('/:id/edit', upload.single('imageFile'), (req, res) => {
  const a = db.prepare('SELECT * FROM articles WHERE id=?').get(req.params.id);
  if (!a) return res.redirect('/admin/articles');
  const { title, section, description, imageUrl, tags, body, status } = req.body;
  const image = req.file ? '/img/uploads/' + req.file.filename : (imageUrl || a.image);
  const now = new Date().toISOString();
  db.prepare('UPDATE articles SET title=?,section=?,description=?,image=?,body=?,tags=?,status=?,updated_at=? WHERE id=?')
    .run(title, section, description, image, body, tags, status || 'draft', now, a.id);
  deleteMarkdown(a);
  const updated = { ...a, title, section, description, image, body, tags, status };
  if (status === 'published') {
    writeMarkdown(updated);
    gitPush(`Update article: ${title}`);
  }
  res.redirect('/admin/articles');
});

// POST /admin/articles/:id/delete
router.post('/:id/delete', (req, res) => {
  const a = db.prepare('SELECT * FROM articles WHERE id=?').get(req.params.id);
  if (a) {
    deleteMarkdown(a);
    db.prepare('DELETE FROM articles WHERE id=?').run(a.id);
    gitPush(`Delete article: ${a.title}`);
  }
  res.redirect('/admin/articles');
});

module.exports = router;
