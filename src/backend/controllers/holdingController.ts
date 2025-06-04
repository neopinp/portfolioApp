/*
Add a holding to a portfolio
Update a holding in a portfolio
Remove a holding from a portfolio 
*/

import { Response } from "express";
import { AuthenticatedRequest } from "../types/auth";
import { HoldingService } from "../services/holdingservice";
import { AddHoldingDto } from "../types/portfolio";

const holdingService = new HoldingService();

export const addHolding = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = parseInt((req.user as any).id);
    const portfolioId = parseInt(req.params.portfolioId);
    const holdingData: AddHoldingDto = req.body;
    const holding = await holdingService.addHolding(
      userId,
      portfolioId,
      holdingData
    );
    res.json({ message: "Holding Added", holding });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: "Failed to add holding" });
  }
};

export const removeHolding = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = parseInt((req.user as any).id);
    const portfolioId = parseInt(req.params.portfolioId);
    const holdingId = parseInt(req.params.holdingId);

    const result = await holdingService.removeHolding(
      userId,
      portfolioId,
      holdingId
    );
    res.json({ message: "Removed Holding", result });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: "Could not remove holding" });
  }
};

export const updateHolding = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const userId = parseInt((req.user as any).id);
  const portfolioId = parseInt(req.params.portfolioId);
  const holdingId = parseInt(req.params.holdingId);

  const updateData: Partial<AddHoldingDto> = req.body;

  try {
    const holding = await holdingService.updateHolding(
      userId,
      portfolioId,
      holdingId,
      updateData
    );
    res.json({ message: "Holding Updated", holding });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: "Failed to update holding" });
  }
};
