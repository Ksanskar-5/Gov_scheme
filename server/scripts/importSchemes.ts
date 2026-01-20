import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import { parse } from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// Import Schemes from CSV
// ============================================

const CSV_PATH = path.join(__dirname, '../../updated_data.csv');
const DB_PATH = path.join(__dirname, '../data/schemes.db');

console.log('🇮🇳 JanScheme - Scheme Import Tool');
console.log('===================================');
console.log('');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('📁 Created data directory');
}

// Check if CSV exists
if (!fs.existsSync(CSV_PATH)) {
    console.error('❌ CSV file not found:', CSV_PATH);
    process.exit(1);
}

console.log('📄 Reading CSV file:', CSV_PATH);

// Read and parse CSV
const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');

// Parse CSV with proper options for the format
const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
    trim: true,
});

console.log(`📊 Found ${records.length} records in CSV`);
console.log('');

// Initialize database
console.log('🗄️  Initializing database...');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create schema
db.exec(`
  DROP TABLE IF EXISTS scheme_keywords;
  DROP TABLE IF EXISTS user_schemes;
  DROP TABLE IF EXISTS user_profiles;
  DROP TABLE IF EXISTS schemes_fts;
  DROP TABLE IF EXISTS schemes;
  
  CREATE TABLE schemes (
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
  
  CREATE INDEX idx_schemes_slug ON schemes(slug);
  CREATE INDEX idx_schemes_level ON schemes(level);
  CREATE INDEX idx_schemes_category ON schemes(category);
  CREATE INDEX idx_schemes_state ON schemes(state);
  
  CREATE TABLE user_profiles (
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
  
  CREATE TABLE user_schemes (
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
  
  CREATE INDEX idx_user_schemes_user ON user_schemes(user_id);
  CREATE INDEX idx_user_schemes_scheme ON user_schemes(scheme_id);
  
  CREATE TABLE scheme_keywords (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scheme_id INTEGER NOT NULL,
    keyword TEXT NOT NULL,
    weight REAL DEFAULT 1.0,
    FOREIGN KEY (scheme_id) REFERENCES schemes(id),
    UNIQUE(scheme_id, keyword)
  );
  
  CREATE INDEX idx_scheme_keywords_keyword ON scheme_keywords(keyword);
  CREATE INDEX idx_scheme_keywords_scheme ON scheme_keywords(scheme_id);
`);

console.log('✅ Database schema created');

// Prepare insert statement
const insertScheme = db.prepare(`
  INSERT INTO schemes (name, slug, details, benefits, eligibility, application, documents, level, category, tags, state)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// Extract state from category or eligibility text
function extractState(record: any): string | null {
    const statePatterns = [
        /Andhra Pradesh/i, /Arunachal Pradesh/i, /Assam/i, /Bihar/i, /Chhattisgarh/i,
        /Goa/i, /Gujarat/i, /Haryana/i, /Himachal Pradesh/i, /Jharkhand/i,
        /Karnataka/i, /Kerala/i, /Madhya Pradesh/i, /Maharashtra/i, /Manipur/i,
        /Meghalaya/i, /Mizoram/i, /Nagaland/i, /Odisha/i, /Punjab/i,
        /Rajasthan/i, /Sikkim/i, /Tamil Nadu/i, /Telangana/i, /Tripura/i,
        /Uttar Pradesh/i, /Uttarakhand/i, /West Bengal/i, /Delhi/i,
        /Puducherry/i, /Chandigarh/i, /Jammu/i, /Kashmir/i, /Ladakh/i,
    ];

    const text = `${record.details || ''} ${record.eligibility || ''}`;

    for (const pattern of statePatterns) {
        const match = text.match(pattern);
        if (match) {
            return match[0];
        }
    }

    return null;
}

// Determine level from context
function determineLevel(record: any): 'Central' | 'State' {
    const details = (record.details || '').toLowerCase();
    const schemeName = (record.scheme_name || '').toLowerCase();

    // Check for central government indicators
    const centralIndicators = [
        'central government', 'government of india', 'ministry of',
        'nationwide', 'all india', 'pradhan mantri', 'pm-', 'national',
        'central sector', 'centrally sponsored'
    ];

    for (const indicator of centralIndicators) {
        if (details.includes(indicator) || schemeName.includes(indicator)) {
            return 'Central';
        }
    }

    // Check the level field
    if (record.level) {
        const level = record.level.toLowerCase().trim();
        if (level === 'central') return 'Central';
        if (level === 'state') return 'State';
    }

    // Check for state indicators
    const stateIndicators = [
        'state government', 'government of', 'union territory',
        'ut of', 'state of'
    ];

    for (const indicator of stateIndicators) {
        if (details.includes(indicator)) {
            return 'State';
        }
    }

    // Default based on state extraction
    const state = extractState(record);
    return state ? 'State' : 'Central';
}

// Generate slug if not provided
function generateSlug(name: string, index: number): string {
    if (!name) return `scheme-${index}`;

    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 100) || `scheme-${index}`;
}

// Insert schemes
console.log('📥 Importing schemes...');
const slugSet = new Set<string>();
let imported = 0;
let skipped = 0;

const insertTransaction = db.transaction(() => {
    for (let i = 0; i < records.length; i++) {
        const record = records[i];

        try {
            // Extract and clean data
            const name = (record.scheme_name || '').trim();
            if (!name) {
                skipped++;
                continue;
            }

            // Generate unique slug
            let slug = record.slug ? record.slug.trim() : generateSlug(name, i);
            let slugCounter = 1;
            while (slugSet.has(slug)) {
                slug = `${generateSlug(name, i)}-${slugCounter}`;
                slugCounter++;
            }
            slugSet.add(slug);

            const details = (record.details || '').trim();
            const benefits = (record.benefits || '').trim();
            const eligibility = (record.eligibility || '').trim();
            const application = (record.application || '').trim();
            const documents = (record.documents || '').trim();
            const level = determineLevel(record);
            const category = (record.schemeCategory || '').trim();
            const tags = (record.tags || '').trim();
            const state = level === 'State' ? extractState(record) : null;

            insertScheme.run(
                name,
                slug,
                details,
                benefits,
                eligibility,
                application,
                documents,
                level,
                category,
                tags,
                state
            );

            imported++;

            // Progress indicator
            if (imported % 500 === 0) {
                console.log(`   Imported ${imported} schemes...`);
            }
        } catch (error: any) {
            console.error(`   ⚠️ Error importing record ${i}:`, error.message);
            skipped++;
        }
    }
});

insertTransaction();

console.log('');
console.log(`✅ Imported ${imported} schemes`);
console.log(`⚠️ Skipped ${skipped} records`);

// Create FTS index
console.log('');
console.log('🔍 Building full-text search index...');

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
  
  INSERT INTO schemes_fts(rowid, name, details, benefits, eligibility, tags)
  SELECT id, name, details, benefits, eligibility, tags FROM schemes;
`);

console.log('✅ FTS index created');

// Generate statistics
console.log('');
console.log('📊 Database Statistics:');

const stats = db.prepare(`
  SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN level = 'Central' THEN 1 ELSE 0 END) as central,
    SUM(CASE WHEN level = 'State' THEN 1 ELSE 0 END) as state,
    COUNT(DISTINCT category) as categories
  FROM schemes
`).get() as { total: number; central: number; state: number; categories: number };

console.log(`   Total Schemes: ${stats.total}`);
console.log(`   Central Schemes: ${stats.central}`);
console.log(`   State Schemes: ${stats.state}`);
console.log(`   Categories: ${stats.categories}`);

// Show sample categories
const categories = db.prepare(`
  SELECT category, COUNT(*) as count 
  FROM schemes 
  WHERE category IS NOT NULL AND category != ''
  GROUP BY category 
  ORDER BY count DESC 
  LIMIT 10
`).all() as { category: string; count: number }[];

console.log('');
console.log('📁 Top Categories:');
categories.forEach((c, i) => {
    console.log(`   ${i + 1}. ${c.category}: ${c.count} schemes`);
});

db.close();

console.log('');
console.log('========================================');
console.log('✅ Import completed successfully!');
console.log(`📍 Database saved to: ${DB_PATH}`);
console.log('========================================');
