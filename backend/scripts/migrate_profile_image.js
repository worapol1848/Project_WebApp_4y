// code in this file is written by worapol สุดหล่อ
const db = require('../config/db');

async function migrate() {
  try {
    console.log('Starting migration: adding profile_image to users table...');
    await db.query('ALTER TABLE users ADD COLUMN profile_image VARCHAR(255) DEFAULT NULL');
    console.log('Migration successful: profile_image column added.');
    process.exit(0);
  } catch (err) {
    if (err.code === 'ER_DUP_COLUMN_NAME') {
      console.log('Migration skipped: profile_image column already exists.');
      process.exit(0);
    } else {
      console.error('Migration failed:', err.message);
      process.exit(1);
    }
  }
}

migrate();
