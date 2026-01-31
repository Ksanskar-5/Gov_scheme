import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Connection pool for PostgreSQL (Supabase)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
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
