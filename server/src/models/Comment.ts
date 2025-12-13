import pool from '../config/database';

export interface Comment {
    id: number;
    post_id: string; // Changed to string (UUID)
    user_id: number;
    content: string;
    is_resolved: boolean;
    created_at: Date;
    username?: string; // For display
    user_email?: string;
    avatar?: string;
}

export const createComment = async (postId: string, userId: number, content: string): Promise<Comment> => {
    const result = await pool.query(
        `INSERT INTO comments (post_id, user_id, content) 
         VALUES ($1, $2, $3) 
         RETURNING *`,
        [postId, userId, content]
    );
    return result.rows[0];
};

export const getPostComments = async (postId: string): Promise<Comment[]> => {
    const result = await pool.query(
        `SELECT c.*, u.username, u.email as user_email, u.profile_picture as avatar
         FROM comments c
         JOIN users u ON c.user_id = u.id
         WHERE c.post_id = $1
         ORDER BY c.created_at DESC`,
        [postId]
    );
    return result.rows;
};

export const getUserCommentsOnPost = async (postId: string, userId: number): Promise<Comment[]> => {
    const result = await pool.query(
        `SELECT c.*, u.username, u.email as user_email, u.profile_picture as avatar
         FROM comments c
         JOIN users u ON c.user_id = u.id
         WHERE c.post_id = $1 AND c.user_id = $2
         ORDER BY c.created_at DESC`,
        [postId, userId]
    );
    return result.rows;
};

export const deleteComment = async (commentId: number): Promise<void> => {
    await pool.query('DELETE FROM comments WHERE id = $1', [commentId]);
};

export const getCommentById = async (commentId: number): Promise<Comment | null> => {
    const result = await pool.query('SELECT * FROM comments WHERE id = $1', [commentId]);
    return result.rows[0] || null;
};
