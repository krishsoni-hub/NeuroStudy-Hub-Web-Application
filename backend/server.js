require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

// ─── Required env check ───────────────────────────────────────────────────────
const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length) {
  console.error(`\n❌ Missing required env vars: ${missing.join(', ')}`);
  console.error('   Copy .env.example to .env and fill in the values.\n');
  process.exit(1);
}

const app = express();

// ─── Rate limit ───────────────────────────────────────────────────────────────
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
}));

// ─── Core middleware ──────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, cb) => cb(null, true), // allow all origins on local network
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── DB-required middleware ───────────────────────────────────────────────────
// Returns a user-friendly error when MongoDB isn't connected yet.
function requireDB(req, res, next) {
  if (mongoose.connection.readyState === 1) return next();
  return res.status(503).json({
    error: 'db_not_connected', // machine-readable code — frontend handles display
  });
}

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',  requireDB, require('./routes/auth'));
app.use('/api/user',  requireDB, require('./routes/user'));
app.use('/api/notes', requireDB, require('./routes/notes'));
app.use('/api/tools',            require('./routes/tools')); // AI works without DB

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({
  status: 'ok',
  db:    mongoose.connection.readyState === 1,
  ai:    !!(process.env.OPENROUTER_API_KEY),
  email: !!(process.env.EMAIL_USER && process.env.EMAIL_USER !== 'your_gmail@gmail.com'),
}));

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: `Not found: ${req.method} ${req.path}` }));

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[Server Error]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});

async function start() {
  // Try MongoDB — keep retrying in background so Atlas cold-start doesn't block
  connectDB();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n✅ NeuroStudy Hub backend running`);
    console.log(`   Local:   http://localhost:${PORT}`);
    console.log(`   Network: http://192.168.1.53:${PORT}  ← use this on mobile`);
    console.log(`   OpenRouter AI : ${process.env.OPENROUTER_API_KEY ? '✅' : '❌ add OPENROUTER_API_KEY to .env'}`);
    console.log(`   Email         : ${require('./services/email').isConfigured() ? '✅ configured' : '⚠️  EMAIL_PASS not set — add Gmail App Password to .env'}`);
    console.log(`   MongoDB       : connecting...\n`);
  });
}

async function connectDB() {
  const uri = process.env.MONGO_URI;
  const opts = {
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS: 45000,
  };

  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    try {
      await mongoose.connect(uri, opts);
      console.log('✅ MongoDB connected');
      return;
    } catch (err) {
      attempts++;
      const msg = err.message || '';

      if (msg.includes('bad auth') || msg.includes('Authentication failed') || msg.includes('authentication failed')) {
        console.error('\n❌ MongoDB authentication failed — wrong password in MONGO_URI');
        console.error('   Fix: MongoDB Atlas → Database Access → Edit user → reset password');
        console.error('   Then update MONGO_URI in Sample/backend/.env\n');
        return; // no point retrying with wrong credentials
      }

      if (msg.includes('ENOTFOUND') || msg.includes('getaddrinfo')) {
        console.error('\n❌ MongoDB DNS error — check your Atlas cluster hostname in MONGO_URI\n');
        return;
      }

      if (attempts < maxAttempts) {
        console.warn(`⚠️  MongoDB attempt ${attempts}/${maxAttempts} failed: ${msg.slice(0, 80)}`);
        console.warn(`   Retrying in 3s...`);
        await new Promise(r => setTimeout(r, 3000));
      } else {
        console.error('\n❌ MongoDB could not connect after multiple attempts.');
        console.error('   Auth routes will return an error until DB is available.\n');
      }
    }
  }
}

start();
