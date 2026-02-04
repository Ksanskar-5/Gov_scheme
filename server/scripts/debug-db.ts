import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

async function checkTables() {
    console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...');

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        // List all tables in the database
        const result = await pool.query(`
            SELECT schemaname, tablename 
            FROM pg_tables 
            WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
            ORDER BY schemaname, tablename;
        `);

        console.log('\n📋 Tables found in database:');
        if (result.rows.length === 0) {
            console.log('  ❌ NO TABLES FOUND!');
        } else {
            result.rows.forEach(row => {
                console.log(`  - ${row.schemaname}.${row.tablename}`);
            });
        }

        // Try to count users
        try {
            const usersResult = await pool.query('SELECT COUNT(*) FROM public.users');
            console.log('\n✅ Users table has', usersResult.rows[0].count, 'records');
        } catch (err: any) {
            console.log('\n❌ Cannot access public.users:', err.message);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

checkTables();
