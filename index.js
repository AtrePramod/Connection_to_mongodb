// app.js
import express from 'express';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();                              // reads .env

// ---------- 1. MySQL connection ----------
const {
  DB_HOST     = 'localhost',
  DB_PORT     = 3306,
  DB_USER     = 'root',
  DB_PASSWORD = '',
  DB_NAME     = 'my_database',
} = process.env;

// open a connection pool
const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  multipleStatements: true,
});

// ensure DB exists, then table exists
await pool.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
await pool.query(`USE \`${DB_NAME}\`;`);
await pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id    INT AUTO_INCREMENT PRIMARY KEY,
    name  VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    age   INT
  );
`);

console.log('✅  MySQL connected & schema ready');

// ---------- 2. Express setup ----------
const app = express();
app.use(express.json());

// helper: run queries with pooled connection
const query = (sql, params) => pool.query(sql, params);

// GET /users  → list all users
app.get('/users', async (_req, res) => {
  try {
    const [rows] = await query('SELECT * FROM users');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /users  → create new user
app.post('/users', async (req, res) => {
  try {
    const { name, email, age } = req.body;
    if (!name || !email) throw new Error('Name & email required');

    const sql = 'INSERT INTO users (name, email, age) VALUES (?, ?, ?)';
    const [{ insertId }] = await query(sql, [name, email, age ?? null]);

    const [rows] = await query('SELECT * FROM users WHERE id = ?', [insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    // duplicate email → SQL error code 1062
    const status = err.code === 'ER_DUP_ENTRY' ? 400 : 500;
    res.status(status).json({ message: err.message });
  }
});

// ---------- 3. Start server ----------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀  API ready at http://localhost:${PORT}`));
