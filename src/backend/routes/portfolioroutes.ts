import express from "express";
import { verifyToken } from "../middleware/auth.middleware";
import {
  createPortfolio,
  getPortfolios,
  getPortfolio,
  deletePortfolio,
  generateHistoricalData,
  updateCurrentValue,
  getPortfolioChartData,
} from "../controllers/portfolioController";

const router = express.Router();

// Makes all the routes protected
router.use(verifyToken);

// Portfolio routes
router.post("/", createPortfolio);
router.get("/", getPortfolios);
router.get("/:id", getPortfolio);
router.delete("/:id", deletePortfolio);

// Historical data generation route (for simulation mode)
router.post(
  "/:id/historical-data",
  /* (req, res, next) => {
  console.log("Historical data route hit!");
  console.log("Portfolio ID:", req.params.id);
  console.log("Request body:", req.body);
  next();
}, */ generateHistoricalData
);

// Current value update route (for real trading mode)
router.post(
  "/:id/current-value" /*
  (req, res, next) => {
    console.log("Current value route hit!");
    console.log("Portfolio ID:", req.params.id);
    console.log("Request body:", req.body);
    next();
  }, */,
  updateCurrentValue
);

// Chart data route
router.get(
  "/:id/chart" /*
  (req, res, next) => {
    console.log("Chart data route hit!");
    console.log("Portfolio ID:", req.params.id);
    console.log("Time Range:", req.query.timeRange || "1M");
    next();
  }, */,
  getPortfolioChartData
);

export default router;
