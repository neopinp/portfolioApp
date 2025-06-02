import express from "express";
import { loginUser, registerUser, getCurrentUser } from "../controllers/authController";
import { verifyToken } from "../middleware/auth.middleware";

const router = express.Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected route example - /api/auth/me
router.get("/protected", verifyToken, getCurrentUser);

export default router;
