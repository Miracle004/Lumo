import pool from '../config/database';

export interface Post {
  id: string;
  author_id: number;
  title: string | null;
  content: any; // JSONB
  cover_image_url: string | null;
  status: 'draft' | 'published';
  category: string | null;
  read_time: number | null;
  created_at: Date;
  updated_at: Date;
  published_at: Date | null;
}

export const createPost = async (authorId: number, title?: string, content?: any): Promise<Post> => {
  const result = await pool.query(
    'INSERT INTO posts (author_id, title, content) VALUES ($1, $2, $3) RETURNING *',
    [authorId, title, content]
  );
  return result.rows[0];
};

export const getPostById = async (id: string): Promise<Post | null> => {
  const result = await pool.query('SELECT * FROM posts WHERE id = $1', [id]);
  return result.rows[0] || null;
};

export const updatePost = async (id: string, title?: string, content?: any, coverImageUrl?: string): Promise<Post> => {
    const result = await pool.query(
        `UPDATE posts 
         SET title = COALESCE($2, title), 
             content = COALESCE($3, content), 
             cover_image_url = COALESCE($4, cover_image_url),
             updated_at = NOW()
         WHERE id = $1 
         RETURNING *`,
        [id, title, content, coverImageUrl]
    );
    return result.rows[0];
};

export const getUserDrafts = async (userId: number): Promise<Post[]> => {
    const result = await pool.query(
        `SELECT * FROM posts WHERE author_id = $1 AND status = 'draft' ORDER BY updated_at DESC`,
        [userId]
    );
    return result.rows;
};

export const getSharedDrafts = async (userId: number): Promise<Post[]> => {
    const result = await pool.query(
        `SELECT p.*, u.username as author_name
         FROM posts p
         JOIN post_collaborators pc ON p.id = pc.post_id
         JOIN users u ON p.author_id = u.id
         WHERE pc.user_id = $1 AND p.status = 'draft'
         ORDER BY p.updated_at DESC`,
        [userId]
    );
    return result.rows;
};

export const publishPost = async (id: string, readTime: number): Promise<Post> => {
    const result = await pool.query(
        `UPDATE posts 
         SET status = 'published', 
             published_at = NOW(), 
             read_time = $2,
             updated_at = NOW()
         WHERE id = $1 
         RETURNING *`,
        [id, readTime]
    );
    return result.rows[0];
};

export const getPublishedPosts = async (limit: number = 10, offset: number = 0): Promise<Post[]> => {
    const result = await pool.query(
        `SELECT p.*, u.username as author_name, u.profile_picture as author_avatar 
         FROM posts p 
         JOIN users u ON p.author_id = u.id 
         WHERE status = 'published' 
         ORDER BY published_at DESC 
         LIMIT $1 OFFSET $2`,
        [limit, offset]
    );
    return result.rows;
};

export const getUserPublishedPosts = async (userId: number): Promise<Post[]> => {
    const result = await pool.query(
        `SELECT * FROM posts WHERE author_id = $1 AND status = 'published' ORDER BY published_at DESC`,
        [userId]
    );
    return result.rows;
};

export const bookmarkPost = async (userId: number, postId: string): Promise<void> => {
    await pool.query(
        'INSERT INTO bookmarks (user_id, post_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [userId, postId]
    );
};

export const unbookmarkPost = async (userId: number, postId: string): Promise<void> => {
    await pool.query(
        'DELETE FROM bookmarks WHERE user_id = $1 AND post_id = $2',
        [userId, postId]
    );
};

export const getBookmarkedPosts = async (userId: number): Promise<Post[]> => {
    const result = await pool.query(
        `SELECT p.*, u.username as author_name, u.profile_picture as author_avatar
         FROM posts p
         JOIN bookmarks b ON p.id = b.post_id
         JOIN users u ON p.author_id = u.id
         WHERE b.user_id = $1
         ORDER BY b.created_at DESC`,
        [userId]
    );
    return result.rows;
};
