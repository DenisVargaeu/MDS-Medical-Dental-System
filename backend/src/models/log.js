const db = require('../config/db');

const Log = {
  list: async (limit = 100) => {
    const [rows] = await db.query(`
      SELECT l.*, u.name as user_name, u.surname as user_surname 
      FROM mds_logs l 
      LEFT JOIN mds_users u ON l.user_id = u.id 
      ORDER BY l.created_at DESC LIMIT ?`, [limit]);
    return rows;
  },
  create: async (userId, action, entity, entityId, details = null, ip = null) => {
    await db.query(
      'INSERT INTO mds_logs (user_id, action, entity, entity_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, action, entity, entityId, details ? JSON.stringify(details) : null, ip]
    );
  }
};

module.exports = Log;
