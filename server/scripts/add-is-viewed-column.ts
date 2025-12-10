import pool from '../src/config/database';

const runMigration = async () => {
  try {
    console.log('Adding is_viewed column to post_collaborators table...');
    await pool.query(`
      ALTER TABLE post_collaborators 
      ADD COLUMN IF NOT EXISTS is_viewed BOOLEAN DEFAULT FALSE;
    `);
    console.log('Migration successful');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit();
  }
};

runMigration();
