import pool from '../config/database';

export interface User {
  id: number;
  username: string;
  email: string;
  password?: string;
  google_id?: string;
  auth_provider: 'local' | 'google';
  profile_picture?: string;
  bio?: string; // Add bio field
}

export const findUserByEmail = async (email: string): Promise<User | null> => {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
};

export const findUserByGoogleId = async (googleId: string): Promise<User | null> => {
    const result = await pool.query('SELECT * FROM users WHERE google_id = $1', [googleId]);
    return result.rows[0] || null;
};

export const findUserById = async (id: number): Promise<User | null> => {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
};

export const createUser = async (username: string, email: string, password?: string, googleId?: string, authProvider: 'local' | 'google' = 'local', profilePicture?: string): Promise<User> => {
  const result = await pool.query(
    'INSERT INTO users (username, email, password, google_id, auth_provider, profile_picture) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [username, email, password, googleId, authProvider, profilePicture]
  );
  return result.rows[0];
};

export const updateUserGoogleId = async (email: string, googleId: string, profilePicture?: string): Promise<User> => {
    const result = await pool.query(
        'UPDATE users SET google_id = $1, profile_picture = COALESCE($2, profile_picture) WHERE email = $3 RETURNING *',
        [googleId, profilePicture, email]
    );
    return result.rows[0];
};

export const followUser = async (followerId: number, followingId: number): Promise<void> => {
    await pool.query(
        'INSERT INTO followers (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [followerId, followingId]
    );
};

export const unfollowUser = async (followerId: number, followingId: number): Promise<void> => {
    await pool.query(
        'DELETE FROM followers WHERE follower_id = $1 AND following_id = $2',
        [followerId, followingId]
    );
};

export const getFollowers = async (userId: number): Promise<User[]> => {
    const result = await pool.query(
        `SELECT u.id, u.username, u.email, u.profile_picture, u.bio
         FROM users u
         JOIN followers f ON u.id = f.follower_id
         WHERE f.following_id = $1`,
        [userId]
    );
    return result.rows;
};

export const getFollowing = async (userId: number): Promise<User[]> => {
    const result = await pool.query(
        `SELECT u.id, u.username, u.email, u.profile_picture, u.bio
         FROM users u
         JOIN followers f ON u.id = f.following_id
         WHERE f.follower_id = $1`,
        [userId]
    );
    return result.rows;
};

export const isFollowing = async (followerId: number, followingId: number): Promise<boolean> => {
    const result = await pool.query(
        'SELECT 1 FROM followers WHERE follower_id = $1 AND following_id = $2',
        [followerId, followingId]
    );
    return (result.rowCount ?? 0) > 0;
};

export const getFollowCounts = async (userId: number): Promise<{ followers: number; following: number }> => {
    const followersRes = await pool.query('SELECT COUNT(*) FROM followers WHERE following_id = $1', [userId]);
    const followingRes = await pool.query('SELECT COUNT(*) FROM followers WHERE follower_id = $1', [userId]);
    
    return {
        followers: parseInt(followersRes.rows[0].count, 10),
        following: parseInt(followingRes.rows[0].count, 10)
    };
};