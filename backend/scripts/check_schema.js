require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const db = require('../src/config/db');

async function check() {
  try {
    const [rows] = await db.query('DESCRIBE mds_patient_treatments');
    console.table(rows);
    process.exit(0);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
check();
