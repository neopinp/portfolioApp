import express from "express";
import { loginUser, registerUser, getCurrentUser, checkEmail } from "../controllers/authController";
import { verifyToken } from "../middleware/auth.middleware";

const router = express.Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/check-email", checkEmail);

// Protected routes
router.get("/protected", verifyToken, getCurrentUser);

export default router;
