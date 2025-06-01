// CONTROLLERS
// Runs when a route is hit (front desk vs. person who actually does the job)
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { Request, Response } from "express";

const prisma = new PrismaClient();

const registerUser = async (req: Request, res: Response): Promise<void> => {
  const { email, password, username } = req.body;

  try {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: "Invalid email format" });
      return;
    }

    // Force user to pick a username so JWT header contains id, email, username
    if (!username || username.trim() === "") {
      res.status(400).json({ error: "Must choose a username" });
      return;
    }

    const hashed = await bcrypt.hash(password, 10);

    // Create user with Prisma
    const user = await prisma.users.create({
      data: {
        email,
        username,
        password: hashed,
      },
      select: {
        id: true,
        email: true,
        username: true,
        // Don't select password for security
      },
    });

    res.status(201).json({
      message: "User registered",
      user: user,
    });
  } catch (err: any) {
    // Handle Prisma unique constraint violations
    if (err.code === "P2002") {
      // P2002 is Prisma's unique constraint violation error
      const target = err.meta?.target;
      if (target?.includes("email")) {
        res.status(400).json({ error: "Email is already in use" });
        return;
      }
      if (target?.includes("username")) {
        res.status(400).json({ error: "Username is already in use" });
        return;
      }
      res.status(400).json({ error: "Email or username is already in use" });
      return;
    }

    if (err instanceof Error) {
      res.status(500).json({ error: "Server error" });
      return;
    }
    res.status(500).json({ error: "Unknown server error" });
  }
};

const loginUser = async (req: Request, res: Response): Promise<void> => {
  const { emailorUsername, password } = req.body;

  try {
    // Find user by email OR username using Prisma
    const user = await prisma.users.findFirst({
      where: {
        OR: [{ email: emailorUsername }, { username: emailorUsername }],
      },
    });

    if (!user) {
      res.status(400).json({ error: "Invalid username or email" });
      return;
    }

    // Check password
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
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
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
