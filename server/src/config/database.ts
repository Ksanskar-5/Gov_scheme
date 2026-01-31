import pg from 'pg';

const { Pool } = pg;

console.log('📡 DATABASE_URL configured:', process.env.DATABASE_URL ? 'yes' : 'NO - MISSING!');

// Connection pool for PostgreSQL (Supabase)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
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
