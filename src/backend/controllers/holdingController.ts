/*
Add a holding to a portfolio
Update a holding in a portfolio
Remove a holding from a portfolio 
*/

import { Response } from "express";
import { AuthenticatedRequest } from "../types/auth";
import { AddHoldingDto } from "../types/portfolio";
import { services } from "../config/services";

export const addHolding = async (
  req: AuthenticatedRequest,
  response: Response
): Promise<void> => {};

// implement get holdings for an asset (different dates of purchase)

export const simulateHolding = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = parseInt((req.user as any).id);
    const portfolioId = parseInt(req.params.portfolioId);
    const holdingData: AddHoldingDto = req.body;
    const holding = await services.holding.simulateHolding(
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

    const result = await services.holding.removeHolding(
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
    const holding = await services.holding.updateHolding(
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
