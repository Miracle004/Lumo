import pool from '../src/config/database';

const runMigration = async () => {
  try {
    console.log('Adding bio column to users table...');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT');
    console.log('Migration successful');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit();
  }
};

runMigration();
