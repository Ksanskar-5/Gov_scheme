import dotenv from 'dotenv';
// Load env BEFORE anything else to ensure correct DATABASE_URL
dotenv.config({ override: true });

import pg from 'pg';

const { Pool } = pg;

console.log('📡 DATABASE_URL configured:', process.env.DATABASE_URL ? 'yes' : 'NO - MISSING!');
console.log('📡 DATABASE_URL value:', process.env.DATABASE_URL?.substring(0, 60) + '...');

// Connection pool for PostgreSQL (Supabase)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    // Explicitly set the search_path to public schema
    options: '-c search_path=public',
});

// Test connection on startup
pool.on('connect', () => {
    console.log('📦 Connected to Supabase PostgreSQL');
});

pool.on('error', (err) => {
    console.error('❌ Unexpected database error:', err);
});

// Initialize database (verify connection)
export async function initializeDatabase(): Promise<void> {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        console.log('✅ Database connected at:', result.rows[0].now);
        client.release();
    } catch (error) {
        console.error('❌ Failed to connect to database:', error);
        throw error;
    }
}

// Export pool for use in services
export default pool;
