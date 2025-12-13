import pool from '../src/config/database';

const createTagsTables = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS tags (
                id SERIAL PRIMARY KEY,
                name VARCHAR(50) UNIQUE NOT NULL
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS post_tags (
                post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
                tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
                PRIMARY KEY (post_id, tag_id)
            );
        `);
        console.log('Tags tables created successfully');
    } catch (error) {
        console.error('Error creating tags tables:', error);
    } finally {
        await pool.end();
    }
};

createTagsTables();
