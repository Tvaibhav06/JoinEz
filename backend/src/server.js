const app = require('./app');
const env = require('./config/env');
const { runMigrations } = require('./db/migrate');
const { seedData } = require('./db/seeds/001_seed_data');
const { pool } = require('./config/db');

async function startServer() {
  try {
    // Run migrations automatically to ensure tables exist
    await runMigrations();

    // Check if users exist; if empty database, automatically run seed
    const userCount = await pool.query('SELECT COUNT(*)::int AS count FROM users');
    if (userCount.rows[0].count === 0) {
      console.log('⚡ Empty database detected. Running seed data automatically...');
      await seedData();
    }

    const server = app.listen(env.PORT, () => {
      console.log(`🚀 Joineazy Backend running on port ${env.PORT} in ${env.NODE_ENV} mode`);
      console.log(`📡 Base API URL: http://localhost:${env.PORT}/api`);
    });

    const shutdown = () => {
      console.log('Shutting down server gracefully...');
      server.close(() => {
        pool.end(() => {
          console.log('PostgreSQL pool closed.');
          process.exit(0);
        });
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
