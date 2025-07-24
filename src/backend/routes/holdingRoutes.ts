import express from "express";
import { verifyToken } from "../middleware/auth.middleware";
import {
  removeHolding,
  updateHolding,
  addHolding,
} from "../controllers/holdingController";

// All routes are protected
const router = express.Router();
router.use(verifyToken);

// All routes start with /api/holdings
router.post("/:portfolioId", addHolding)
router.delete("/:portfolioId/:holdingId", removeHolding);
router.put("/:portfolioId/:holdingId", updateHolding);

export default router;
