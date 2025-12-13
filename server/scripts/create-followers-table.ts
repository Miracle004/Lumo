import pool from '../src/config/database';

const createFollowersTable = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS followers (
                follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (follower_id, following_id),
                CHECK (follower_id != following_id)
            );
        `);
        console.log('Followers table created successfully');
    } catch (error) {
        console.error('Error creating followers table:', error);
    } finally {
        await pool.end();
    }
};

createFollowersTable();
