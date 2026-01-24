import Database, { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_PATH = process.env.DATABASE_PATH || path.join(__dirname, '../../data/schemes.db');

// Initialize database connection
const db: DatabaseType = new Database(DATABASE_PATH);
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

  // Auth users table (for login credentials)
  db.exec(`
    CREATE TABLE IF NOT EXISTS auth_users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    
    CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth_users(email);
  `);

  // User profiles table - with migration for existing databases
  // First, check if table exists
  const profilesTableExists = db.prepare(`
    SELECT name FROM sqlite_master WHERE type='table' AND name='user_profiles'
  `).get();

  if (profilesTableExists) {
    // Check if auth_user_id column exists
    const columns = db.prepare(`PRAGMA table_info(user_profiles)`).all() as { name: string }[];
    const hasAuthUserId = columns.some(col => col.name === 'auth_user_id');

    if (!hasAuthUserId) {
      console.log('📝 Migrating user_profiles table - adding auth_user_id column...');
      db.exec(`ALTER TABLE user_profiles ADD COLUMN auth_user_id TEXT`);
    }
  } else {
    // Create new table with auth_user_id
    db.exec(`
      CREATE TABLE user_profiles (
        id TEXT PRIMARY KEY,
        auth_user_id TEXT,
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
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (auth_user_id) REFERENCES auth_users(id)
      );
    `);
  }

  // Create index if not exists
  db.exec(`CREATE INDEX IF NOT EXISTS idx_user_profiles_auth ON user_profiles(auth_user_id);`);

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
