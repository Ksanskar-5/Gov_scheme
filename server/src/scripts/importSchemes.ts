import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import db from '../config/database.js';

/**
 * Import schemes from cleaned_schemes.csv into the database
 * Clears existing schemes and bulk inserts new ones
 */

interface SchemeRow {
    id: string;
    name: string;
    slug: string;
    level: string;
    state: string;
    category: string;
    benefits: string;
    eligibility: string;
    documents: string;
    application: string;
    details: string;
    tags: string;
    created_at: string;
    updated_at: string;
}

async function importSchemes() {
    const csvPath = path.join(process.cwd(), '..', 'cleaned_schemes.csv');

    console.log('📁 Reading CSV file:', csvPath);

    if (!fs.existsSync(csvPath)) {
        console.error('❌ CSV file not found:', csvPath);
        process.exit(1);
    }

    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    const records: SchemeRow[] = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        relaxColumnCount: true,
        relaxQuotes: true,
    });

    console.log(`📊 Parsed ${records.length} schemes from CSV`);

    const pool = db.getPool();
    const client = await pool.connect();

    try {
        // Start transaction
        await client.query('BEGIN');

        // Clear existing schemes
        console.log('🗑️  Clearing existing schemes...');
        await client.query('DELETE FROM public.schemes');

        // Insert in batches
        const batchSize = 500;
        let inserted = 0;

        for (let i = 0; i < records.length; i += batchSize) {
            const batch = records.slice(i, i + batchSize);

            for (const row of batch) {
                try {
                    await client.query(`
                        INSERT INTO public.schemes 
                        (name, slug, level, state, category, benefits, eligibility, documents, application, details, tags)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                    `, [
                        row.name?.substring(0, 500) || 'Unnamed Scheme',
                        row.slug || `scheme-${i}`,
                        row.level || 'Central',
                        row.state || null,
                        row.category || 'General',
                        row.benefits || null,
                        row.eligibility || null,
                        row.documents || null,
                        row.application || null,
                        row.details || null,
                        row.tags ? `{${row.tags.split(',').map(t => `"${t.trim()}"`).join(',')}}` : null,
                    ]);
                    inserted++;
                } catch (err: any) {
                    console.error(`⚠️ Row ${i} error:`, err.message);
                }
            }

            console.log(`✅ Inserted ${inserted}/${records.length} schemes`);
        }

        await client.query('COMMIT');
        console.log(`\n🎉 Import complete! ${inserted} schemes imported.`);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Import failed:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

importSchemes().catch(console.error);
