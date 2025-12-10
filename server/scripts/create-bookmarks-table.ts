import pool from '../src/config/database';

const runMigration = async () => {
  try {
    console.log('Creating bookmarks table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bookmarks (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, post_id)
      );
    `);
    console.log('Migration successful');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit();
  }
};

runMigration();
