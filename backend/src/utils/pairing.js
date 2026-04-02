const os = require('os');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

/**
 * Generates a random 6-digit numeric pairing code.
 */
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Gets the local IPv4 address and hostname.
 */
function getServerInfo() {
  const hostname = os.hostname();
  const interfaces = os.networkInterfaces();
  let ip = '127.0.0.1';

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        ip = iface.address;
        break;
      }
    }
    if (ip !== '127.0.0.1') break;
  }

  return { hostname, ip };
}

/**
 * Ensures a valid pairing code exists in the database.
 * Regenerates if expired (7 days).
 */
async function ensurePairingCode() {
  try {
    // Check for existing valid code
    const [rows] = await db.query(
      'SELECT pairing_code, expires_at FROM mds_pairing WHERE expires_at > NOW() ORDER BY created_at DESC LIMIT 1'
    );

    if (rows.length > 0) {
      return rows[0].pairing_code;
    }

    // Generate new code
    const newCode = generateCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await db.query(
      'INSERT INTO mds_pairing (pairing_code, expires_at) VALUES (?, ?)',
      [newCode, expiresAt]
    );

    return newCode;
  } catch (err) {
    console.error('[Pairing Error] Failed to ensure pairing code:', err.message);
    return '000000'; // Fallback
  }
}

/**
 * Verifies a pairing code.
 */
async function verifyPairingCode(code) {
  const [rows] = await db.query(
    'SELECT id FROM mds_pairing WHERE pairing_code = ? AND expires_at > NOW()',
    [code]
  );
  return rows.length > 0;
}

module.exports = {
  getServerInfo,
  ensurePairingCode,
  verifyPairingCode
};
