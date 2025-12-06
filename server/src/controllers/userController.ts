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
      bcrypt.hash(
        password,
        saltrounds,
        async (err: Error | undefined, hash: string) => {
          if (err) {
            res.status(500);
            console.log(err);
          } else {
            const result = await client.query(
              "INSERT INTO users (username, email, password) VALUES($1, $2, $3) RETURNING id, username, email",
              [username, email, hash]
            );
            const user = result.rows[0];
            req.login(user, (err) =>{
              console.error(err);
              res.status(201).json({ message: "User created successfully", user: user });
            })
          }
        }
      );
    } catch (err: any) {
      res.status(500).json({ error: err.message ?? err });
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ error: "Internal server error", err });
  }
};

export const verify = async (username: string, password: string, cb: any) => {
  try {
    const client = await pool.connect();

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
  }
};

export default {
  createUser,
  verify,
};
