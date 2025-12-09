import pool from '../config/database';

export interface Collaborator {
    id: string;
    post_id: string;
    user_id: number;
    permission: 'edit' | 'comment' | 'view';
    invited_by: number;
    invited_at: Date;
}

export const addCollaborator = async (postId: string, userId: number, permission: 'edit' | 'comment' | 'view', invitedBy: number): Promise<Collaborator> => {
    const result = await pool.query(
        `INSERT INTO post_collaborators (post_id, user_id, permission, invited_by) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (post_id, user_id) DO UPDATE SET permission = $3
         RETURNING *`,
        [postId, userId, permission, invitedBy]
    );
    return result.rows[0];
};

export const getCollaborators = async (postId: string): Promise<any[]> => {
    // Return user details along with permission
    const result = await pool.query(
        `SELECT pc.*, u.username, u.email, u.profile_picture 
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

export const isCollaborator = async (postId: string, userId: number): Promise<Collaborator | null> => {
    const result = await pool.query(
        'SELECT * FROM post_collaborators WHERE post_id = $1 AND user_id = $2',
        [postId, userId]
    );
    return result.rows[0] || null;
};
