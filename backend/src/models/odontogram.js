const db = require('../config/db');

const Odontogram = {
  getByPatient: async (patientId) => {
    const [rows] = await db.query('SELECT * FROM mds_odontogram WHERE patient_id = ?', [patientId]);
    return rows;
  },
  saveTooth: async (patientId, toothNumber, state, notes) => {
    const [rows] = await db.query(
      'INSERT INTO mds_odontogram (patient_id, tooth_number, state, notes) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE state = VALUES(state), notes = VALUES(notes)',
      [patientId, toothNumber, state, notes]
    );
    return rows;
  }
};

module.exports = Odontogram;
