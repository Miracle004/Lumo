import pool from '../src/config/database';

const createNotificationsTable = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
                type VARCHAR(50) NOT NULL,
                message TEXT,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Notifications table created successfully');
    } catch (error) {
        console.error('Error creating notifications table:', error);
    } finally {
        await pool.end();
    }
};

createNotificationsTable();
