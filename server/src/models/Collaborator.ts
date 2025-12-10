import pool from '../config/database';

export interface Collaborator {
    id: string;
    post_id: string;
    user_id: number;
    permission: 'edit' | 'comment' | 'view';
    invited_by: number;
    invited_at: Date;
    is_viewed: boolean;
    // Joined fields
    email?: string;
    username?: string;
}

export const isCollaborator = async (postId: string, userId: number): Promise<Collaborator | null> => {
    const result = await pool.query(
        'SELECT * FROM post_collaborators WHERE post_id = $1 AND user_id = $2',
        [postId, userId]
    );
    return result.rows[0] || null;
};

export const addCollaborator = async (postId: string, userId: number, permission: string, invitedBy: number): Promise<Collaborator> => {
    const result = await pool.query(
        `INSERT INTO post_collaborators (post_id, user_id, permission, invited_by, is_viewed) 
         VALUES ($1, $2, $3, $4, FALSE)
         ON CONFLICT (post_id, user_id) DO UPDATE SET permission = $3, is_viewed = FALSE
         RETURNING *`,
        [postId, userId, permission, invitedBy]
    );
    return result.rows[0];
};

export const getPostCollaborators = async (postId: string): Promise<Collaborator[]> => {
    const result = await pool.query(
        `SELECT pc.*, u.username, u.email 
         FROM post_collaborators pc
         JOIN users u ON pc.user_id = u.id
         WHERE pc.post_id = $1`,
        [postId]
    );
    return result.rows;
};

export const removeCollaborator = async (postId: string, userId: number): Promise<void> => {
    await pool.query(
        'DELETE FROM post_collaborators WHERE post_id = $1 AND user_id = $2',
        [postId, userId]
    );
};

export const getUnreadInviteCount = async (userId: number): Promise<number> => {
    const result = await pool.query(
        `SELECT COUNT(*) as count FROM post_collaborators WHERE user_id = $1 AND is_viewed = FALSE`,
        [userId]
    );
    return parseInt(result.rows[0].count, 10);
};

export const markInvitesAsRead = async (userId: number): Promise<void> => {
    await pool.query(
        `UPDATE post_collaborators SET is_viewed = TRUE WHERE user_id = $1 AND is_viewed = FALSE`,
        [userId]
    );
};