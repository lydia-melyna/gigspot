require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'gigspot_secret_key_2025';
const PORT = process.env.PORT || 8081;

// ─── PostgreSQL connection ─────────────────────────────────────────────────────
const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME     || 'authdb',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

// ─── Init DB table ─────────────────────────────────────────────────────────────
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id       SERIAL PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      email    VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role     VARCHAR(50)  NOT NULL DEFAULT 'USER',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log('✅ Table users prête');
}

// ─── Routes ────────────────────────────────────────────────────────────────────

// Health check
app.get('/auth/health', (req, res) => {
  res.json({ status: 'UP', service: 'gigspot-auth-service' });
});

// Register
app.post('/auth/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.json({ success: false, message: 'Tous les champs sont requis' });

  try {
    const exists = await pool.query(
      'SELECT id FROM users WHERE username=$1 OR email=$2', [username, email]
    );
    if (exists.rows.length > 0) {
      const taken = exists.rows[0];
      const msg = taken.username === username ? 'Pseudo déjà pris' : 'Email déjà utilisé';
      return res.json({ success: false, message: msg });
    }

    const hashed = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3)',
      [username, email, hashed]
    );

    const token = jwt.sign({ username, role: 'USER' }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ success: true, token, username, message: 'Compte créé !' });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'Erreur serveur' });
  }
});

// Login
app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.json({ success: false, message: 'Identifiants requis' });

  try {
    const result = await pool.query('SELECT * FROM users WHERE username=$1', [username]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.json({ success: false, message: 'Identifiants incorrects' });

    const token = jwt.sign({ username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ success: true, token, username: user.username, email: user.email });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'Erreur serveur' });
  }
});

// Validate token
app.get('/auth/validate', (req, res) => {
  const header = req.headers['authorization'] || '';
  const token = header.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ valid: true, username: decoded.username, role: decoded.role });
  } catch {
    res.json({ valid: false });
  }
});

// ─── Start ─────────────────────────────────────────────────────────────────────
initDB().then(() => {
  app.listen(PORT, () => console.log(`🎤 auth-service démarré sur le port ${PORT}`));
}).catch(err => {
  console.error('❌ Impossible de se connecter à PostgreSQL:', err.message);
  process.exit(1);
});
