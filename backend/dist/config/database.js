"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeDatabase = exports.getPool = exports.query = exports.connectDatabase = void 0;
const pg_1 = require("pg");
let pool;
const connectDatabase = () => {
    try {
        pool = new pg_1.Pool({
            user: process.env.DB_USER || 'postgres',
            host: process.env.DB_HOST || 'localhost',
            database: process.env.DB_NAME || 'careconnect',
            password: process.env.DB_PASSWORD || 'password',
            port: parseInt(process.env.DB_PORT || '5432'),
            ssl: false,
        });
        console.log('✅ Database connection pool created');
    }
    catch (error) {
        console.error('❌ Database connection error:', error);
        throw error;
    }
};
exports.connectDatabase = connectDatabase;
const query = async (text, params) => {
    if (!pool) {
        throw new Error('Database not initialized. Call connectDatabase() first.');
    }
    try {
        const result = await pool.query(text, params);
        return result;
    }
    catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
};
exports.query = query;
const getPool = () => {
    if (!pool) {
        throw new Error('Database not initialized. Call connectDatabase() first.');
    }
    return pool;
};
exports.getPool = getPool;
const closeDatabase = async () => {
    if (pool) {
        await pool.end();
        console.log('✅ Database connection closed');
    }
};
exports.closeDatabase = closeDatabase;
//# sourceMappingURL=database.js.map