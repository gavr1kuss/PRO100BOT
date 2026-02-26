const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, 'bot.sqlite');

let db = null;

/**
 * Инициализация базы данных
 */
async function initDb() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY,
      stage TEXT,
      direction TEXT,
      format TEXT,
      service TEXT,
      level TEXT,
      limitations TEXT,
      equipment TEXT,
      training_days TEXT,
      goal TEXT,
      city TEXT,
      awaiting TEXT,
      name TEXT,
      phone TEXT,
      email TEXT,
      callback_time TEXT,
      guide_image_index INTEGER,
      guide_type TEXT,
      ref_code TEXT UNIQUE,
      referred_by INTEGER,
      package TEXT,
      username TEXT
    );
  `);

  const alterCols = [
    'guide_image_index', 'guide_type', 'ref_code', 'referred_by', 'package', 'username',
    'selected_injuries', 'selected_goals', 'program_direction', 'gift_type', 'package_price'
  ];
  for (const col of alterCols) {
    try {
      db.run(`ALTER TABLE users ADD COLUMN ${col} ${col === 'referred_by' ? 'INTEGER' : 'TEXT'}`);
    } catch (e) { }
  }

  db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_ref_code ON users(ref_code)');
  saveDb();
  return db;
}

function saveDb() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function getUser(userId) {
  if (!db) throw new Error('Database not initialized');

  const stmt = db.prepare('SELECT * FROM users WHERE user_id = ?');
  stmt.bind([userId]);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();

  const refCode = 'u' + String(userId) + '_' + crypto.randomBytes(4).toString('hex');
  db.run(
    'INSERT INTO users (user_id, stage, ref_code) VALUES (?, ?, ?)',
    [userId, 'menu', refCode]
  );
  saveDb();

  const s2 = db.prepare('SELECT * FROM users WHERE user_id = ?');
  s2.bind([userId]);
  s2.step();
  const r = s2.getAsObject();
  s2.free();
  return r;
}

function userExists(userId) {
  if (!db) return false;
  const stmt = db.prepare('SELECT 1 FROM users WHERE user_id = ?');
  stmt.bind([userId]);
  const exists = stmt.step();
  stmt.free();
  return exists;
}

function setUser(userId, patch) {
  if (!db) throw new Error('Database not initialized');
  const keys = Object.keys(patch).filter(k => patch[k] !== undefined);
  if (keys.length === 0) return;
  const sets = keys.map(k => `${k} = ?`).join(', ');
  const values = keys.map(k => patch[k]);
  values.push(userId);
  db.run(`UPDATE users SET ${sets} WHERE user_id = ?`, values);
  saveDb();
}

function countReferrals(userId) {
  if (!db) return 0;
  const stmt = db.prepare('SELECT COUNT(*) as c FROM users WHERE referred_by = ?');
  stmt.bind([userId]);
  stmt.step();
  const c = stmt.getAsObject().c;
  stmt.free();
  return c;
}

function getUserByRefCode(code) {
  if (!db || !code) return null;
  const stmt = db.prepare('SELECT user_id FROM users WHERE ref_code = ?');
  stmt.bind([code]);
  if (!stmt.step()) {
    stmt.free();
    return null;
  }
  const id = stmt.getAsObject().user_id;
  stmt.free();
  return id;
}

module.exports = { initDb, getUser, setUser, countReferrals, getUserByRefCode, userExists };
