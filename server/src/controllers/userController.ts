import pool from "../config/database";
import bcrypt from "bcrypt";
import type { Request, Response } from "express";
import * as UserModel from '../models/User';
import * as PostModel from '../models/Post';

const saltrounds = 10;

export const createUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({ error: "One or more fields are empty" });
      return;
    }

    const client = await pool.connect();
    try {
      const hash = await bcrypt.hash(password, saltrounds);
      
      console.log(`Attempting to create user: ${username}, ${email}`);
      const result = await client.query(
        "INSERT INTO users (username, email, password) VALUES($1, $2, $3) RETURNING id, username, email",
        [username, email, hash]
      );
      const user = result.rows[0];
      console.log('User inserted into DB:', user);
      
      req.login(user, (err) => {
        if (err) {
          console.error("Login failed after signup:", err);
          res.status(500).json({ error: "Login failed after signup" });
          return;
        }
        console.log('User logged in successfully after signup');
        res.status(201).json({ message: "User created successfully", user: user });
      });

    } catch (err: any) {
      if (err.code === '23505') {
        res.status(409).json({ error: "User with this username or email already exists" });
      } else {
        res.status(500).json({ error: err.message ?? err });
      }
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ error: "Internal server error", err });
  }
};

export const verify = async (username: string, password: string, cb: any) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT * FROM users WHERE username = $1 OR email = $1",
      [username]
    );
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const hasheddbpassword = user.password;
      bcrypt.compare(password, hasheddbpassword, (err, rez) => {
        if (err) {
          console.log(err);
          return cb(err);
        } else {
          if (rez) {
            console.log(user);
            return cb(null, user);
          } else {
            console.log("Wrong password");
            return cb(null, false, { message: "Incorrect password" });
          }
        }
      });
    } else {
      console.log("No user found");
      return cb(null, false, { message: "Incorrect username or password" });
    }
  } catch (err) {
    console.error(err);
    return cb(err);
  } finally {
    client.release();
  }
};


export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.isAuthenticated()) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { bio, profile_picture, username } = req.body;
    const userId = (req.user as any).id;

    const client = await pool.connect();
    try {
      const updates: string[] = [];
      const params: any[] = [];
      let paramCount = 1;

      if (bio !== undefined) {
        updates.push(`bio = $${paramCount}`);
        params.push(bio);
        paramCount++;
      }
      if (profile_picture !== undefined) {
        updates.push(`profile_picture = $${paramCount}`);
        params.push(profile_picture);
        paramCount++;
      }
      if (username !== undefined) {
        updates.push(`username = $${paramCount}`);
        params.push(username);
        paramCount++;
      }

      if (updates.length === 0) {
         res.status(400).json({ error: 'No fields to update' });
         return;
      }

      const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, username, email, profile_picture, bio`;
      params.push(userId);

      const result = await client.query(query, params);
      
      if (result.rows.length > 0) {
        res.status(200).json({ message: 'Profile updated successfully', user: result.rows[0] });
      } else {
        res.status(404).json({ message: 'User not found' });
      }

    } catch (err: any) {
      console.error('Error updating profile:', err);
      if (err.code === '23505') { // Unique violation
          res.status(409).json({ error: 'Username already taken' });
      } else {
          res.status(500).json({ error: err.message ?? 'Internal server error' });
      }
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error in updateProfile:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const followUser = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const followerId = (req.user as any).id;
        const followingId = parseInt(req.params.id);

        if (followerId === followingId) {
            return res.status(400).json({ error: 'Cannot follow yourself' });
        }

        await UserModel.followUser(followerId, followingId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to follow user', details: error });
    }
};

export const unfollowUser = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const followerId = (req.user as any).id;
        const followingId = parseInt(req.params.id);

        await UserModel.unfollowUser(followerId, followingId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to unfollow user', details: error });
    }
};

export const getFollowers = async (req: Request, res: Response) => {
    try {
        const userId = parseInt(req.params.id);
        const followers = await UserModel.getFollowers(userId);
        res.json(followers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch followers', details: error });
    }
};

export const getFollowing = async (req: Request, res: Response) => {
    try {
        const userId = parseInt(req.params.id);
        const following = await UserModel.getFollowing(userId);
        res.json(following);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch following', details: error });
    }
};

export const getFollowStatus = async (req: Request, res: Response) => {
    try {
        const userId = parseInt(req.params.id);
        const currentUserId = req.user ? (req.user as any).id : null;
        
        if (!currentUserId) {
             return res.json({ isFollowing: false });
        }

        const isFollowing = await UserModel.isFollowing(currentUserId, userId);
        res.json({ isFollowing });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch follow status', details: error });
    }
};

export const getFollowCounts = async (req: Request, res: Response) => {
    try {
        const userId = parseInt(req.params.id);
        const counts = await UserModel.getFollowCounts(userId);
        res.json(counts);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch follow counts', details: error });
    }
};

export const getPublicProfile = async (req: Request, res: Response) => {
    try {
        const userId = parseInt(req.params.id);
        const user = await UserModel.findUserById(userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const counts = await UserModel.getFollowCounts(userId);
        const posts = await PostModel.getUserPublishedPosts(userId);

        res.json({
            user: {
                id: user.id,
                username: user.username,
                bio: user.bio,
                avatar: user.profile_picture
            },
            stats: counts,
            posts
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch profile', details: error });
    }
};

export default {
  createUser,
  verify,
  updateProfile,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getFollowStatus,
  getFollowCounts,
  getPublicProfile
};