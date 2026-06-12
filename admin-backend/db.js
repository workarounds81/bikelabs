const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'admin.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    slug TEXT UNIQUE,
    section TEXT,
    description TEXT,
    image TEXT,
    body TEXT,
    tags TEXT,
    status TEXT DEFAULT 'draft',
    created_at TEXT,
    updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS shop (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    category TEXT,
    type TEXT,
    asin TEXT,
    affiliate_url TEXT,
    price TEXT,
    description TEXT,
    verdict TEXT,
    image TEXT,
    own_url TEXT,
    status TEXT DEFAULT 'active',
    created_at TEXT,
    updated_at TEXT
  );
`);

module.exports = db;
