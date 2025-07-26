import express from "express";
import { verifyToken } from "../middleware/auth.middleware";
import {
  removeHolding,
  updateHolding,
  addHolding,
  getHoldingsBySymbol,
  getPortfolioPerformance,
  getAggregatedHoldings,
  getPortfolioAnalytics,
  getPortfolioHistory,
  createSnapshot,
  checkSnapshotNeeded,
  getLastSnapshotDate,
} from "../controllers/holdingController";

// All routes are protected
const router = express.Router();
router.use(verifyToken);

// All routes start with /api/holdings
router.post("/:portfolioId", addHolding);
router.delete("/:portfolioId/:holdingId", removeHolding);
router.put("/:portfolioId/:holdingId", updateHolding);

// Returns aggregated holdings for collapsed view
router.get("/:portfolioId/aggregated", getAggregatedHoldings);
// Returns all transactions for one asset (for expandable view)
router.get("/:portfolioId/symbol/:symbol", getHoldingsBySymbol);
// Returns performance Data (general portfolio overview & charting data)
router.get("/:portfolioId/performance", getPortfolioPerformance);

router.get("/:portfolioId/analytics", getPortfolioAnalytics);
router.get("/:portfolioId", getPortfolioHistory);

// Snapshot management
router.post("/:portfolioId/snapshot", createSnapshot);
router.get("/:portfolioId/snapshot/check", checkSnapshotNeeded);
router.get("/:portfolioId/snapshot/last", getLastSnapshotDate);

export default router;
