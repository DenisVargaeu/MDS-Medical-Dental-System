const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');
const crypto = require('crypto');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setup() {
  console.log('\n\x1b[36m%s\x1b[0m', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\x1b[36m%s\x1b[0m', '   MDS – Medical Dental System Setup Wizard');
  console.log('\x1b[36m%s\x1b[0m', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('This script will configure your database and environment.\n');

  const dbHost = await question('Enter MySQL Host [localhost]: ') || 'localhost';
  const dbName = await question('Enter Database Name [mds_db]: ') || 'mds_db';
  const dbUser = await question('Enter MySQL User [root]: ') || 'root';
  const dbPass = await question('Enter MySQL Password: ');

  const jwtSecret = crypto.randomBytes(32).toString('hex');
  const uploadDir = 'uploads';

  const envContent = `DB_HOST=${dbHost}
DB_USER=${dbUser}
DB_PASS=${dbPass}
DB_NAME=${dbName}
JWT_SECRET=${jwtSecret}
UPLOAD_DIR=${uploadDir}
PORT=3000
`;

  const backendDir = path.join(__dirname, 'backend');
  const envPath = path.join(backendDir, '.env');

  try {
    fs.writeFileSync(envPath, envContent);
    console.log(`\n\x1b[32m✔\x1b[0m Environment file created at: backend/.env`);
  } catch (err) {
    console.error(`\x1b[31m✘\x1b[0m Error writing .env file: ${err.message}`);
    process.exit(1);
  }

  const runSchema = await question('\nWould you like to try importing the SQL schema now? (y/n): ');
  if (runSchema.toLowerCase() === 'y') {
    console.log('\nAttempting to import schema.sql...');
    try {
      // Use mysql command line client if available
      const sqlPath = path.join(backendDir, 'schema.sql');
      const passFlag = dbPass ? `-p"${dbPass}"` : '';
      const cmd = `mysql -h ${dbHost} -u ${dbUser} ${passFlag} -e "CREATE DATABASE IF NOT EXISTS ${dbName}; USE ${dbName}; SOURCE ${sqlPath};"`;
      
      execSync(cmd, { stdio: 'inherit' });
      console.log(`\x1b[32m✔\x1b[0m Database schema imported successfully.`);
    } catch (err) {
      console.log(`\x1b[33m⚠\x1b[0m Could not import schema automatically. You might need to do it manually:`);
      console.log(`   mysql -u ${dbUser} -p < backend/schema.sql`);
    }
  }

  console.log('\n\x1b[32m%s\x1b[0m', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\x1b[32m%s\x1b[0m', '   Setup Complete!');
  console.log('\x1b[32m%s\x1b[0m', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\nNext steps:');
  console.log('1. Start backend: \x1b[36mcd backend && npm run dev\x1b[0m');
  console.log('2. Start frontend: \x1b[36mcd frontend && npm start\x1b[0m\n');

  rl.close();
}

setup();
