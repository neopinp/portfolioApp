import express from "express";
import { verifyToken } from "../middleware/auth.middleware";
import {
  createPortfolio,
  getPortfolios,
  getPortfolio,
  deletePortfolio,
  generateHistoricalData,
} from "../controllers/portfolioController";

const router = express.Router();

// Makes all the routes protected
router.use(verifyToken);

// Portfolio routes
router.post("/", createPortfolio);
router.get("/", getPortfolios);
router.get("/:id", getPortfolio);
router.delete("/:id", deletePortfolio);

// Historical data generation route
router.post("/:portfolioId/historical-data", generateHistoricalData);

export default router;
