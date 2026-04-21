/*
Add a holding to a portfolio
Update a holding in a portfolio
Remove a holding from a portfolio 
*/

import { Response } from "express";
import { AuthenticatedRequest } from "../types/auth";
import { AddHoldingDto } from "../types/portfolio";
import { services } from "../config/services";

// implement get holdings for an asset (different dates of purchase) - NOT MVP

export const addHolding = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = parseInt((req.user as any).id);
    const portfolioId = parseInt(req.params.portfolioId);
    const holdingData: AddHoldingDto = req.body;
    const holding = await services.holding.addHolding(
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

export const getHoldingsBySymbol = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = parseInt((req.user as any).id);
    const { portfolioId, symbol } = req.params;

    const holdings = await services.holding.getHoldingsBySymbol(
      userId,
      parseInt(portfolioId),
      symbol
    );
    res.json({ message: "Holdings Fetched", holdings });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch symbol holdings" });
  }
};

export const getPortfolioPerformance = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = parseInt((req.user as any).id);
    const { portfolioId } = req.params;
    const symbol = req.query.symbol as string | undefined;

    const performance = await services.holding.getHoldingPerformance(
      userId,
      parseInt(portfolioId),
      symbol
    );
    res.json({ message: "Fetching Portfolio Performance", performance });
  } catch (error) {
    res.status(500).json({ error: "Failed to get portfolio performance" });
  }
};

export const getAggregatedHoldings = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = parseInt((req.user as any).id);
    const { portfolioId } = req.params;

    const aggregatedHoldings = await services.holding.getHoldingsAggregated(
      userId,
      parseInt(portfolioId)
    );

    res.json({ message: "Fetched Summarized Holdings", aggregatedHoldings });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch aggregated holdings" });
  }
};

export const getPortfolioAnalytics = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = parseInt((req.user as any).id);
    const portfolioId = parseInt(req.params.portfolioId);

    const analytics = await services.holding.getPortfolioAnalytics(
      userId,
      portfolioId
    );
    res.json({ message: "Fetching Analytics", analytics });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch portfolio analytics" });
  }
};
export const getPortfolioHistory = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = parseInt((req.user as any).id);
    const portfolioId = parseInt(req.params.portfolioId);
    const timeRange = req.query.timeRange as
      | "1D"
      | "1W"
      | "1M"
      | "3M"
      | "6M"
      | "1Y"
      | "5Y";

    const history = await services.holding.getPortfolioHistory(
      userId,
      portfolioId,
      timeRange
    );
    res.json({ message: "Fetched portfolio history", history });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch portfolio history" });
  }
};

// In holdingController.ts
export const createSnapshot = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = parseInt((req.user as any).id);
    const portfolioId = parseInt(req.params.portfolioId);

    const snapshot = await services.holding.createPortfolioSnapshot(
      userId,
      portfolioId
    );
    res.json({ message: "Created portfolio snapshot", snapshot });
  } catch (error) {
    res.status(500).json({ error: "Failed to create portfolio snapshot" });
  }
};

export const checkSnapshotNeeded = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = parseInt((req.user as any).id);
    const portfolioId = parseInt(req.params.portfolioId);

    const needsSnapshot = await services.holding.needsSnapshot(userId, portfolioId);
    res.json({ needsSnapshot });
  } catch (error) {
    res.status(500).json({ error: "Failed to check snapshot status" });
  }
};

export const getLastSnapshotDate = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = parseInt((req.user as any).id);
    const portfolioId = parseInt(req.params.portfolioId);

    const lastSnapshotDate = await services.holding.getLastSnapshotDate(userId, portfolioId);
    res.json({ lastSnapshotDate });
  } catch (error) {
    res.status(500).json({ error: "Failed to get last snapshot date" });
  }
};
