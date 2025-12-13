import pool from '../config/database';

export interface Notification {
    id: number;
    user_id: number;
    actor_id: number | null;
    post_id: string | null;
    type: 'comment' | 'invite' | 'system';
    message: string;
    is_read: boolean;
    created_at: Date;
    actor_name?: string;
    actor_avatar?: string;
    post_title?: string;
}

export const createNotification = async (
    userId: number,
    actorId: number | null,
    postId: string | null,
    type: string,
    message: string
): Promise<Notification> => {
    const result = await pool.query(
        `INSERT INTO notifications (user_id, actor_id, post_id, type, message)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [userId, actorId, postId, type, message]
    );
    return result.rows[0];
};

export const getUserNotifications = async (userId: number): Promise<Notification[]> => {
    const result = await pool.query(
        `SELECT n.*, 
                u.username as actor_name, 
                u.profile_picture as actor_avatar,
                p.title as post_title
         FROM notifications n
         LEFT JOIN users u ON n.actor_id = u.id
         LEFT JOIN posts p ON n.post_id = p.id
         WHERE n.user_id = $1
         ORDER BY n.created_at DESC
         LIMIT 50`,
        [userId]
    );
    return result.rows;
};

export const getUnreadCount = async (userId: number): Promise<number> => {
    const result = await pool.query(
        `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = FALSE`,
        [userId]
    );
    return parseInt(result.rows[0].count, 10);
};

export const markAsRead = async (userId: number, notificationId?: number, postId?: string): Promise<void> => {
    if (notificationId) {
        await pool.query(
            `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2`,
            [notificationId, userId]
        );
    } else if (postId) {
        await pool.query(
            `UPDATE notifications SET is_read = TRUE WHERE post_id = $1 AND user_id = $2`,
            [postId, userId]
        );
    } else {
        await pool.query(
            `UPDATE notifications SET is_read = TRUE WHERE user_id = $1`,
            [userId]
        );
    }
};
