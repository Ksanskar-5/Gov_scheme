import pg from 'pg';

const { Pool } = pg;

let pool: pg.Pool | null = null;
let isInitialized = false;

// Lazy initialization - creates pool when first needed, after dotenv loads
function getPool(): pg.Pool {
    if (!pool) {
        const dbUrl = process.env.DATABASE_URL;
        console.log('📡 DATABASE_URL configured:', dbUrl ? 'YES' : 'NO - MISSING!');

        pool = new Pool({
            connectionString: dbUrl,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
            ssl: dbUrl?.includes('supabase') ? { rejectUnauthorized: false } : false,
        });

        pool.on('connect', () => {
            console.log('📦 Connected to Supabase PostgreSQL');
        });

        pool.on('error', (err) => {
            console.error('❌ Unexpected database error:', err);
        });
    }
    return pool;
}

// Initialize database (verify connection)
export async function initializeDatabase(): Promise<void> {
    try {
        const p = getPool();
        const client = await p.connect();
        const result = await client.query('SELECT NOW()');
        console.log('✅ Database connected at:', result.rows[0].now);
        client.release();
        isInitialized = true;
    } catch (error) {
        console.error('❌ Failed to connect to database:', error);
        throw error;
    }
}

// Export pool getter for use in services
export default { query: (...args: Parameters<pg.Pool['query']>) => getPool().query(...args) };
export { getPool };
