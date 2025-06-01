/* 
MAIN FILE - ENTRY POINT - ROUTER REGISTRATION  
Imports the route definitions and links them into the app 
*/
import express, { Response } from "express";
import { AuthenticatedRequest } from "./types/auth";
import cors from "cors";
import verifyToken from "./backend/middleware/authMiddleware";
import authRoutes from "./backend/routes/authRoutes";
import pool from "./backend/db";

require("dotenv").config();

const app = express();

app.use(cors()); // allow frontend access
app.use(express.json()); // parse incoming JSON

app.use("/api/auth", authRoutes); // mount all related auth related routes under /api/auth

// testing db connection - FIXED: added req parameter
app.get("/api/test-db", async (res: Response) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ success: true, time: result.rows[0].now });
  } catch (err: unknown) {
    if (err instanceof Error) {
      res.status(500).json({ success: false, error: err.message });
    } else {
      res.status(500).json({ success: false, error: "Unknown error" });
    }
  }
});

// tell Express to listen or fallback to 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.get(
  "/api/protected",
  verifyToken,
  (req: AuthenticatedRequest, res: Response) => {
    res.json({ message: "Access granted", user: req.user });
  }
);
