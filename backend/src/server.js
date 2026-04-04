require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──────────────────────────────────────────────
app.use(cors({
  origin: true, // Allow all origins for the local system to support network pairing
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically (with auth check in production)
const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
app.use('/uploads', express.static(uploadDir));

// ── Routes ──────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/treatments', require('./routes/treatments'));
app.use('/api/records', require('./routes/records'));
app.use('/api/finance', require('./routes/finance'));
app.use('/api/files', require('./routes/files'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/users', require('./routes/users'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/odontogram', require('./routes/odontogram'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/treatment-plans', require('./routes/treatment-plans'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'MDS API', time: new Date().toISOString() });
});

// ── Error Handler ───────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large' });
  }
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ── Start ───────────────────────────────────────────────────
const { getServerInfo, ensurePairingCode } = require('./utils/pairing');

app.listen(PORT, '0.0.0.0', async () => {
  const { hostname, ip } = getServerInfo();
  const pairingCode = await ensurePairingCode();

  console.log(`\n╔════════════════════════════════════════╗`);
  console.log(`║  MDS API Server running on :${PORT}       ║`);
  console.log(`╟────────────────────────────────────────╢`);
  console.log(`║  HOSTNAME: ${hostname.padEnd(27, ' ')} ║`);
  console.log(`║  IP ADDR:  ${ip.padEnd(27, ' ')} ║`);
  console.log(`║  PAIRING:  ${pairingCode.padEnd(27, ' ')} ║`);
  console.log(`╟────────────────────────────────────────╢`);
  console.log(`║  Note: Code expires every 7 days.      ║`);
  console.log(`╚════════════════════════════════════════╝\n`);
});

module.exports = app;
