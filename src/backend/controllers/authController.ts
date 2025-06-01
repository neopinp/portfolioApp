// CONTROLLERS
// Runs when a route is hit (front desk vs. person who actually does the job)
import pool from "../db";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

import { Request, Response } from "express";

const registerUser = async (req: Request, res: Response): Promise<void> => {
  const { email, password, username } = req.body;

  try {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: "Invalid email format" });
      return;
    }
    // force user to pick a username so JWT header contains id,email,username
    if (!username) {
      res.status(400).json({ error: "Must choose a username" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (email, username, password) VALUES ($1, $2, $3) RETURNING id, email, username",
      [email, username, hashed]
    );

    res.status(201).json({ message: "User registered", user: result.rows[0] });
  } catch (err) {
    if ((err as any).code === "23505") {
      // not unique email
      res.status(400).json({ error: "Email is already in use" });
      return;
    }

    if ((err as any).code === "22") {
      res.status(400).json({ error: "Username is already in use" });
      return;
    }
    if (err instanceof Error) {
      res.status(500).json({ error: "Server error" });
      return;
    }
    res.status(500).json({ error: "Unknown server error" });
    return;
  }
};

/* 
ADD CHECKING FOR EMAIL CONDITIONS (NEEDS TO FOLLOW A CERTAIN FORMAT '@' '.com') 
USERNAME BASED LOGIN 
*/

const loginUser = async (req: Request, res: Response): Promise<void> => {
  const { emailorUsername, password } = req.body;

  // check if the user exists in the database, and if so grant access
  // if user does not exist, produce an error message

  try {
    // check user
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1 OR username = $1",
      [emailorUsername]
    );

    if (result.rows.length === 0) {
      res.status(400).json({ error: "Invalid username" });
      return;
    }

    // check pswd

    const user = result.rows[0];

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      res.status(400).json({ error: "Invalid password" });
      return;
    }

    // JWT_SECRET(my special key) used to allow the user to complete an action

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not defined in the environment variables");
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username },
      jwtSecret,
      {
        expiresIn: "1h",
      }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: { id: user.id, email: user.email, username: user.username },
    });
  } catch (err: unknown) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
      return;
    } else {
      res.status(500).json({ error: "Unknown server error" });
      return;
    }
  }
};

export { registerUser, loginUser };
