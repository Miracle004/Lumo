import pool from "../config/database";
import bcrypt from "bcrypt";
import type { Request, Response } from "express";

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
    const userId = (req.user as any).id; // Assuming req.user is populated by Passport

    const client = await pool.connect();
    try {
      let query = 'UPDATE users SET updated_at = NOW() ';
      const params = [];
      let paramCount = 1;

      if (bio !== undefined) {
        query += ` , bio = $${paramCount}`;
        params.push(bio);
        paramCount++;
      }
      if (profile_picture !== undefined) {
        query += ` , profile_picture = $${paramCount}`;
        params.push(profile_picture);
        paramCount++;
      }
      if (username !== undefined) {
        query += ` , username = $${paramCount}`;
        params.push(username);
        paramCount++;
      }

      query += ` WHERE id = $${paramCount} RETURNING id, username, email, profile_picture, bio`;
      params.push(userId);

      const result = await client.query(query, params);
      
      if (result.rows.length > 0) {
        res.status(200).json({ message: 'Profile updated successfully', user: result.rows[0] });
      } else {
        res.status(404).json({ message: 'User not found' });
      }

    } catch (err: any) {
      console.error('Error updating profile:', err);
      res.status(500).json({ error: err.message ?? 'Internal server error' });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error in updateProfile:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default {
  createUser,
  verify,
  updateProfile,
};
