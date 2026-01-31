/**
 * Import Schemes to Supabase (PostgreSQL)
 * Simplified version without transactions
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { parse } from 'csv-parse/sync';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

const CSV_PATH = path.join(__dirname, '../updated_data.csv');

console.log('🇮🇳 JanScheme - Supabase Import Tool');
console.log('=====================================');
console.log('');

if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
}

if (!fs.existsSync(CSV_PATH)) {
    console.error('❌ CSV file not found:', CSV_PATH);
    process.exit(1);
}

// Interface for CSV record
interface SchemeRecord {
    scheme_name?: string;
    slug?: string;
    details?: string;
    benefits?: string;
    eligibility?: string;
    application?: string;
    documents?: string;
    level?: string;
    schemeCategory?: string;
    tags?: string;
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

console.log('📄 Reading CSV file:', CSV_PATH);

const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');

const records: SchemeRecord[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
    trim: true,
});

console.log(`📊 Found ${records.length} records in CSV`);
console.log('');

function extractState(record: SchemeRecord): string | null {
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
        if (match) return match[0];
    }
    return null;
}

function determineLevel(record: SchemeRecord): 'Central' | 'State' {
    const details = (record.details || '').toLowerCase();
    const schemeName = (record.scheme_name || '').toLowerCase();

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

    if (record.level) {
        const level = record.level.toLowerCase().trim();
        if (level === 'central') return 'Central';
        if (level === 'state') return 'State';
    }

    const state = extractState(record);
    return state ? 'State' : 'Central';
}

function generateSlug(name: string, index: number): string {
    if (!name) return `scheme-${index}`;
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 100) || `scheme-${index}`;
}

async function importSchemes() {
    const client = await pool.connect();

    try {
        console.log('🗄️  Connected to Supabase PostgreSQL');

        // Test connection - list tables
        const tableCheck = await client.query(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        `);
        console.log('📋 Found tables:', tableCheck.rows.map(r => r.table_name).join(', '));

        if (tableCheck.rows.length === 0) {
            console.error('❌ No tables found! Please run supabase-schema.sql first.');
            process.exit(1);
        }

        // Clear existing data
        console.log('🧹 Clearing existing schemes...');
        await client.query('TRUNCATE TABLE scheme_keywords, user_schemes, schemes RESTART IDENTITY CASCADE');

        console.log('📥 Importing schemes...');

        const slugSet = new Set<string>();
        let imported = 0;
        let skipped = 0;

        for (let i = 0; i < records.length; i++) {
            const record = records[i];

            try {
                const name = (record.scheme_name || '').trim();
                if (!name) {
                    skipped++;
                    continue;
                }

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

                await client.query(`
                    INSERT INTO schemes (name, slug, details, benefits, eligibility, application, documents, level, category, tags, state)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                `, [name, slug, details, benefits, eligibility, application, documents, level, category, tags, state]);

                imported++;

                if (imported % 500 === 0) {
                    console.log(`   Imported ${imported} schemes...`);
                }
            } catch (error: any) {
                console.error(`   ⚠️ Error importing record ${i}:`, error.message);
                skipped++;
            }
        }

        console.log('');
        console.log(`✅ Imported ${imported} schemes`);
        console.log(`⚠️ Skipped ${skipped} records`);

        // Get statistics
        const stats = await client.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN level = 'Central' THEN 1 ELSE 0 END) as central,
                SUM(CASE WHEN level = 'State' THEN 1 ELSE 0 END) as state
            FROM schemes
        `);

        const row = stats.rows[0];
        console.log('');
        console.log('📊 Database Statistics:');
        console.log(`   Total Schemes: ${row.total}`);
        console.log(`   Central: ${row.central}`);
        console.log(`   State: ${row.state}`);

        console.log('');
        console.log('✅ Import completed successfully!');

    } finally {
        client.release();
        await pool.end();
    }
}

importSchemes().catch(error => {
    console.error('❌ Import failed:', error);
    process.exit(1);
});
