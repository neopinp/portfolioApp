import { Request, Response } from "express";
import {
  UserCredentials,
  LoginCredentials,
  AuthenticatedRequest,
} from "../types/auth";
import { services } from "../config/services";

const registerUser = async (req: Request, res: Response): Promise<void> => {
  const credentials: UserCredentials = req.body;

  try {
    if (!(await services.auth.validateEmail(credentials.email))) {
      res.status(400).json({ error: "Invalid email format" });
      return;
    }

    if (!credentials.username || credentials.username.trim() === "") {
      res.status(400).json({ error: "Must choose a username" });
      return;
    }

    const passwordError = await services.auth.validatePassword(
      credentials.password
    );
    if (passwordError) {
      res.status(400).json({ error: passwordError });
      return;
    }

    const user = await services.auth.createUser(credentials);

    res.status(201).json({
      message: "User registered",
      user: user,
    });
  } catch (err: any) {
    if (err.code === "P2002") {
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

    res.status(500).json({ error: "Server error" });
  }
};

const loginUser = async (req: Request, res: Response): Promise<void> => {
  const credentials: LoginCredentials = req.body;

  try {
    const result = await services.auth.login(credentials);

    if (!result) {
      res.status(400).json({ error: "Invalid credentials" });
      return;
    }

    res.status(200).json({
      message: "Login successful",
      token: result.token,
      user: result.user,
    });
  } catch (err: unknown) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: "Unknown server error" });
  }
};

const checkEmail = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  try {
    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    const exists = await services.auth.checkEmailExists(email);
    res.status(200).json({ exists });
  } catch (err: unknown) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: "Unknown server error" });
  }
};

const getCurrentUser = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  res.json({ user: req.user });
};

export { registerUser, loginUser, checkEmail, getCurrentUser };
