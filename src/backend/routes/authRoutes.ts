/* 
ROUTING LOGIC - what happens when someone hits /register
Define what endpoint (URL + HTTP) should call those LOGIN & REGISTER functions
Mini App 
*/
import express from "express";
import { loginUser } from "../controllers/authController";
import { registerUser } from "../controllers/authController";
const router = express.Router();

router.post("/login", loginUser);
router.post("/register", registerUser);

export default router;

