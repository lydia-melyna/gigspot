require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'gigspot_secret_key_2025';
const PORT = process.env.PORT || 8082;

// ─── PostgreSQL ────────────────────────────────────────────────────────────────
const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME     || 'eventdb',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

// ─── JWT Middleware ────────────────────────────────────────────────────────────
function authMiddleware(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token = header.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Token requis' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide' });
  }
}

// ─── Init DB ───────────────────────────────────────────────────────────────────
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS events (
      id               SERIAL PRIMARY KEY,
      artist           VARCHAR(200) NOT NULL,
      title            VARCHAR(200) NOT NULL,
      venue            VARCHAR(200) NOT NULL,
      city             VARCHAR(100) NOT NULL,
      date             VARCHAR(20)  NOT NULL,
      time             VARCHAR(10)  NOT NULL,
      genre            VARCHAR(50)  NOT NULL,
      image_url        VARCHAR(10)  NOT NULL DEFAULT '🎵',
      price            NUMERIC(10,2) NOT NULL,
      total_seats      INT NOT NULL,
      available_seats  INT NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id          SERIAL PRIMARY KEY,
      event_id    INT NOT NULL REFERENCES events(id),
      username    VARCHAR(100) NOT NULL,
      quantity    INT NOT NULL,
      total_price NUMERIC(10,2) NOT NULL,
      status      VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED',
      booked_at   TIMESTAMP DEFAULT NOW(),
      booking_ref VARCHAR(50) NOT NULL
    )
  `);

  // Seed events if empty
  const count = await pool.query('SELECT COUNT(*) FROM events');
  if (parseInt(count.rows[0].count) === 0) {
    await pool.query(`
      INSERT INTO events (artist, title, venue, city, date, time, genre, image_url, price, total_seats, available_seats) VALUES
      ('Daft Punk Tribute', 'Daft Punk Revival',         'Accor Arena',               'Paris',     '2025-06-14', '21:00', 'ELECTRO', '🤖', 45.00,  5000,  5000),
      ('Rosalía',           'Rosalía World Tour',        'Zénith Paris',              'Paris',     '2025-07-02', '20:30', 'POP',     '🌹', 65.00,  3000,  3000),
      ('Kendrick Lamar',    'Kendrick Lamar',            'Stade de France',           'Paris',     '2025-07-19', '19:00', 'HIPHOP',  '🎤', 89.00, 20000, 20000),
      ('Arctic Monkeys',    'Arctic Monkeys',            'Olympia',                   'Paris',     '2025-08-05', '21:00', 'ROCK',    '🎸', 55.00,  2000,  2000),
      ('Jazz Ensemble',     'Miles Davis Tribute',       'Jazz Club Duc des Lombards','Paris',     '2025-06-28', '22:00', 'JAZZ',    '🎷', 30.00,   200,   200),
      ('Disclosure',        'Disclosure Live',           'Bataclan',                  'Paris',     '2025-09-12', '22:00', 'ELECTRO', '🎧', 40.00,  1500,  1500),
      ('Billie Eilish',     'Billie Eilish',             'Halle Tony Garnier',        'Lyon',      '2025-07-08', '20:00', 'POP',     '🖤', 70.00,  8000,  8000),
      ('Stromae',           'Stromae Racine Carrée',     'Vélodrome',                 'Marseille', '2025-08-22', '20:30', 'POP',     '🇧🇪', 60.00, 10000, 10000)
    `);
    console.log('✅ Données initiales insérées');
  }
  console.log('✅ Tables events & bookings prêtes');
}

// ─── Routes ────────────────────────────────────────────────────────────────────

app.get('/events/health', (req, res) => {
  res.json({ status: 'UP', service: 'gigspot-event-service' });
});

// GET all events
app.get('/events', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM events ORDER BY date ASC');
    // Map snake_case → camelCase pour la compatibilité avec le frontend
    const events = result.rows.map(mapEvent);
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET single event
app.get('/events/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM events WHERE id=$1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Événement introuvable' });
    res.json(mapEvent(result.rows[0]));
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST book event
app.post('/events/:id/book', authMiddleware, async (req, res) => {
  const quantity = parseInt(req.body.quantity) || 1;
  const eventId = parseInt(req.params.id);
  const username = req.user.username;

  try {
    const evRes = await pool.query('SELECT * FROM events WHERE id=$1', [eventId]);
    const ev = evRes.rows[0];
    if (!ev) return res.json({ success: false, message: 'Événement introuvable' });
    if (ev.available_seats < quantity) return res.json({ success: false, message: 'Places insuffisantes' });

    // Update seats
    await pool.query(
      'UPDATE events SET available_seats = available_seats - $1 WHERE id=$2',
      [quantity, eventId]
    );

    const totalPrice = quantity * parseFloat(ev.price);
    const bookingRef = 'GIG-' + (Date.now() % 100000);

    const bRes = await pool.query(
      `INSERT INTO bookings (event_id, username, quantity, total_price, booking_ref)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [eventId, username, quantity, totalPrice, bookingRef]
    );

    res.json({
      success: true,
      booking: mapBooking(bRes.rows[0]),
      message: 'Réservation confirmée !'
    });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'Erreur serveur' });
  }
});

// GET my bookings
app.get('/events/bookings/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM bookings WHERE username=$1 ORDER BY booked_at DESC',
      [req.user.username]
    );
    res.json(result.rows.map(mapBooking));
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE cancel booking
app.delete('/events/bookings/:bookingId', authMiddleware, async (req, res) => {
  const bookingId = parseInt(req.params.bookingId);
  const username = req.user.username;

  try {
    const bRes = await pool.query('SELECT * FROM bookings WHERE id=$1', [bookingId]);
    const b = bRes.rows[0];
    if (!b || b.username !== username)
      return res.json({ success: false, message: 'Réservation introuvable' });

    await pool.query('UPDATE bookings SET status=$1 WHERE id=$2', ['CANCELLED', bookingId]);

    // Restore seats
    await pool.query(
      'UPDATE events SET available_seats = available_seats + $1 WHERE id=$2',
      [b.quantity, b.event_id]
    );

    res.json({ success: true, message: 'Réservation annulée' });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'Erreur serveur' });
  }
});

// ─── Mappers snake_case → camelCase ───────────────────────────────────────────
function mapEvent(r) {
  return {
    id: r.id,
    artist: r.artist,
    title: r.title,
    venue: r.venue,
    city: r.city,
    date: r.date,
    time: r.time,
    genre: r.genre,
    imageUrl: r.image_url,
    price: parseFloat(r.price),
    totalSeats: r.total_seats,
    availableSeats: r.available_seats,
  };
}

function mapBooking(r) {
  return {
    id: r.id,
    eventId: r.event_id,
    username: r.username,
    quantity: r.quantity,
    totalPrice: parseFloat(r.total_price),
    status: r.status,
    bookedAt: r.booked_at,
    bookingRef: r.booking_ref,
  };
}

// ─── Start ─────────────────────────────────────────────────────────────────────
initDB().then(() => {
  app.listen(PORT, () => console.log(`🎵 event-service démarré sur le port ${PORT}`));
}).catch(err => {
  console.error('❌ Impossible de se connecter à PostgreSQL:', err.message);
  process.exit(1);
});
