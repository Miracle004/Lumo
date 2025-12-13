import pool from '../src/config/database';

const createCommentsTable = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS comments (
                id SERIAL PRIMARY KEY,
                post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                content TEXT NOT NULL,
                is_resolved BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Comments table created successfully');
    } catch (error) {
        console.error('Error creating comments table:', error);
    } finally {
        await pool.end();
    }
};

createCommentsTable();
