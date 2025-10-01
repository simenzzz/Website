import { Pool } from 'pg';

let pool: Pool;

export const connectDatabase = () => {
  try {
    pool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'careconnect',
      password: process.env.DB_PASSWORD || 'password',
      port: parseInt(process.env.DB_PORT || '5432'),
      ssl: false,
    });

    console.log('✅ Database connection pool created');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    throw error;
  }
};

export const query = async (text: string, params?: any[]) => {
  if (!pool) {
    throw new Error('Database not initialized. Call connectDatabase() first.');
  }
  
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

export const getPool = () => {
  if (!pool) {
    throw new Error('Database not initialized. Call connectDatabase() first.');
  }
  return pool;
};

export const closeDatabase = async () => {
  if (pool) {
    await pool.end();
    console.log('✅ Database connection closed');
  }
};