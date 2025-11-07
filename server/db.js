const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 54321,
  database: process.env.DB_NAME || 'quizdb',
  user: process.env.DB_USER || 'quizuser',
  password: process.env.DB_PASSWORD || 'quizpass123',
});

module.exports = pool;

