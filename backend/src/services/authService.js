const { pool } = require('../config/db');
const { hashPassword, comparePassword } = require('../utils/password');
const { signToken } = require('../utils/jwt');

async function registerStudent({ name, email, password }) {
  if (!name || !email || !password) {
    const err = new Error('Name, email, and password are required');
    err.statusCode = 400;
    throw err;
  }

  const cleanEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    const err = new Error('Invalid email format');
    err.statusCode = 400;
    throw err;
  }

  if (password.length < 6) {
    const err = new Error('Password must be at least 6 characters');
    err.statusCode = 400;
    throw err;
  }

  // Check duplicate email
  const existing = await pool.query('SELECT id FROM users WHERE LOWER(email) = $1', [cleanEmail]);
  if (existing.rows.length > 0) {
    const err = new Error('An account with this email already exists');
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = await hashPassword(password);
  const result = await pool.query(`
    INSERT INTO users (name, email, password_hash, role)
    VALUES ($1, $2, $3, 'student')
    RETURNING id, name, email, role, created_at
  `, [name.trim(), cleanEmail, passwordHash]);

  const user = result.rows[0];
  const token = signToken({
    sub: user.id,
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name
  });

  return { token, user };
}

async function loginUser({ email, password }) {
  if (!email || !password) {
    const err = new Error('Email and password are required');
    err.statusCode = 400;
    throw err;
  }

  const cleanEmail = email.trim().toLowerCase();
  const result = await pool.query(`
    SELECT id, name, email, password_hash, role, created_at
    FROM users
    WHERE LOWER(email) = $1
  `, [cleanEmail]);

  if (result.rows.length === 0) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const user = result.rows[0];
  const isMatch = await comparePassword(password, user.password_hash);
  if (!isMatch) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const token = signToken({
    sub: user.id,
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name
  });

  const { password_hash, ...safeUser } = user;
  return { token, user: safeUser };
}

module.exports = {
  registerStudent,
  loginUser
};
