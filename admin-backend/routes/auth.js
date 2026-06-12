const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

router.get('/login', (req, res) => {
  let html = fs.readFileSync(path.join(__dirname, '../views/login.html'), 'utf8');
  html = html.replace('{{ERROR_CLASS}}', req.query.error ? 'show' : '');
  res.send(html);
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'xglobalx' && password === '123qwe123QWE') {
    const token = jwt.sign({ username }, process.env.JWT_SECRET || 'bl-secret-change-me', { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    return res.redirect('/admin');
  }
  return res.redirect('/admin/login?error=1');
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  return res.redirect('/admin/login');
});

module.exports = router;
