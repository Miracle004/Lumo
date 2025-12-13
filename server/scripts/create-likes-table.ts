import pool from '../src/config/database';

const createLikesTable = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS likes (
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, post_id)
            );
        `);
        console.log('Likes table created successfully');
    } catch (error) {
        console.error('Error creating likes table:', error);
    } finally {
        await pool.end();
    }
};

createLikesTable();
