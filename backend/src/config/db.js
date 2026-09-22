const { Pool } = require('pg');
const env = require('./env');

const isProduction = env.NODE_ENV === 'production' || (env.DATABASE_URL && env.DATABASE_URL.includes('render.com'));

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect()
};
