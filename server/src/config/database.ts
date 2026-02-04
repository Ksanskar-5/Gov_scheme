import dotenv from 'dotenv';
dotenv.config({ override: true });
import pg from 'pg';
const { Pool } = pg;

let pool: pg.Pool | null = null;

function getPool(): pg.Pool {
    if (!pool) {
        const dbUrl = process.env.DATABASE_URL;
        console.log('📡 DATABASE_URL configured:', dbUrl ? 'YES' : 'NO - MISSING!');
        pool = new Pool({
            connectionString: dbUrl,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
            options: '-c search_path=public',
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

export async function initializeDatabase(): Promise<void> {
    try {
        const p = getPool();
        const client = await p.connect();
        const result = await client.query('SELECT NOW()');
        console.log('✅ Database connected at:', result.rows[0].now);
        client.release();
    } catch (error) {
        console.error('❌ Failed to connect to database:', error);
        throw error;
    }
}

// Properly typed query function that returns the result
async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
    text: string,
    values?: unknown[]
): Promise<pg.QueryResult<T>> {
    return getPool().query<T>(text, values);
}

// Export as default with query method and getPool
const db = {
    query,
    getPool
};

export default db;
export { getPool };
