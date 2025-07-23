/* 
MAIN FILE - ENTRY POINT - ROUTER REGISTRATION  
Imports the route definitions and links them into the app 
*/
import express from "express";
import cors from "cors";
import authRoutes from "./backend/routes/authRoutes";
import portfolioRoutes from "./backend/routes/portfolioroutes";
import holdingRoutes from "./backend/routes/holdingRoutes";
import testRoutes from "./backend/routes/testRoutes";
import { prisma } from "./backend/config/db";

require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// Register routes
app.use("/api/auth", authRoutes);
app.use("/api/portfolios", portfolioRoutes);
app.use("/api/holdings", holdingRoutes);
app.use("/api/test", testRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Graceful shutdown
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});







/*Testing db connection with Prisma
app.get("/api/test-db", async (req: Request, res: Response) => {
  try {
    // Test Prisma connection by running a simple query
    await prisma.$queryRaw`SELECT 1`;
    res.json({ success: true, message: "Database connected successfully" });
  } catch (err: unknown) {
    if (err instanceof Error) {
      res.status(500).json({ success: false, error: err.message });
    } else {
      res.status(500).json({ success: false, error: "Unknown error" });
    }
  }
});
*/

/* Protected route
app.get(
  "/api/protected",
  verifyToken,
  (req: AuthenticatedRequest, res: Response) => {
    res.json({ message: "Access granted", user: req.user });
  }
);
*/
