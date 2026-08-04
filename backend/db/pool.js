const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production' || (process.env.DB_HOST && process.env.DB_HOST !== 'localhost') || !!process.env.DATABASE_URL;

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: isProduction ? { rejectUnauthorized: false } : false,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'chit_restaurant',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '3846',
      ssl: isProduction ? { rejectUnauthorized: false } : false,
    };

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

module.exports = pool;
