import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_PATH = process.env.DATABASE_PATH || path.join(__dirname, '../../data/schemes.db');

// Initialize database connection
const db = new Database(DATABASE_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize database schema
export function initializeDatabase() {
    console.log('🔧 Initializing database schema...');

    // Schemes table
    db.exec(`
    CREATE TABLE IF NOT EXISTS schemes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      details TEXT,
      benefits TEXT,
      eligibility TEXT,
      application TEXT,
      documents TEXT,
      level TEXT CHECK(level IN ('Central', 'State')),
      category TEXT,
      tags TEXT,
      state TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    
    CREATE INDEX IF NOT EXISTS idx_schemes_slug ON schemes(slug);
    CREATE INDEX IF NOT EXISTS idx_schemes_level ON schemes(level);
    CREATE INDEX IF NOT EXISTS idx_schemes_category ON schemes(category);
    CREATE INDEX IF NOT EXISTS idx_schemes_state ON schemes(state);
  `);

    // User profiles table
    db.exec(`
    CREATE TABLE IF NOT EXISTS user_profiles (
      id TEXT PRIMARY KEY,
      name TEXT,
      age INTEGER,
      gender TEXT,
      state TEXT,
      district TEXT,
      income_range TEXT,
      profession TEXT,
      category TEXT,
      is_disabled INTEGER DEFAULT 0,
      is_minority INTEGER DEFAULT 0,
      is_bpl INTEGER DEFAULT 0,
      is_student INTEGER DEFAULT 0,
      is_farmer INTEGER DEFAULT 0,
      is_business_owner INTEGER DEFAULT 0,
      is_worker INTEGER DEFAULT 0,
      is_widow INTEGER DEFAULT 0,
      is_senior_citizen INTEGER DEFAULT 0,
      family_size INTEGER,
      education_level TEXT,
      employment_status TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

    // User saved schemes
    db.exec(`
    CREATE TABLE IF NOT EXISTS user_schemes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      scheme_id INTEGER NOT NULL,
      status TEXT DEFAULT 'saved' CHECK(status IN ('saved', 'applied', 'completed', 'rejected')),
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES user_profiles(id),
      FOREIGN KEY (scheme_id) REFERENCES schemes(id),
      UNIQUE(user_id, scheme_id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_user_schemes_user ON user_schemes(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_schemes_scheme ON user_schemes(scheme_id);
  `);

    // Scheme embeddings for vector search (simple approach)
    db.exec(`
    CREATE TABLE IF NOT EXISTS scheme_keywords (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scheme_id INTEGER NOT NULL,
      keyword TEXT NOT NULL,
      weight REAL DEFAULT 1.0,
      FOREIGN KEY (scheme_id) REFERENCES schemes(id),
      UNIQUE(scheme_id, keyword)
    );
    
    CREATE INDEX IF NOT EXISTS idx_scheme_keywords_keyword ON scheme_keywords(keyword);
    CREATE INDEX IF NOT EXISTS idx_scheme_keywords_scheme ON scheme_keywords(scheme_id);
  `);

    // Full-text search virtual table
    db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS schemes_fts USING fts5(
      name,
      details,
      benefits,
      eligibility,
      tags,
      content='schemes',
      content_rowid='id'
    );
  `);

    console.log('✅ Database schema initialized');
}

// Rebuild FTS index
export function rebuildFtsIndex() {
    console.log('🔄 Rebuilding full-text search index...');

    db.exec(`
    DELETE FROM schemes_fts;
    INSERT INTO schemes_fts(rowid, name, details, benefits, eligibility, tags)
    SELECT id, name, details, benefits, eligibility, tags FROM schemes;
  `);

    console.log('✅ FTS index rebuilt');
}

export default db;
