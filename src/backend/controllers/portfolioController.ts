/* 
Create a new portfolio
Get all portfolios for a user
Get a single portfolio by ID
Delete a portfolio by ID

*/

import { Response } from "express";
import { AuthenticatedRequest } from "../types/auth";
import { PortfolioService } from "../services/portfolioservices";

const portfolioService = new PortfolioService();

// verifyToken is called before executing these routes and returns authenticatedRequest
// request body is the user's input
export const createPortfolio = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    const userId = parseInt(req.user.id);
    if (isNaN(userId)) {
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }

    // Validate required fields
    const { name, starting_balance, risk_score } = req.body;
    if (!name || typeof name !== "string") {
      res.status(400).json({ error: "Missing Portfolio Name" });
      return;
    }
    if (
      !starting_balance ||
      typeof starting_balance !== "number" ||
      starting_balance < 0
    ) {
      res
        .status(400)
        .json({
          error: "Starting balance is required and must be a positive number",
        });
      return;
    }
    if (typeof risk_score !== "number" || risk_score < 1 || risk_score > 10) {
      res
        .status(400)
        .json({ error: "Risk score must be a number between 1 and 10" });
      return;
    }

    const portfolio = await portfolioService.createPortfolio(userId, {
      name,
      starting_balance,
      risk_score,
    });
    res.json(portfolio);
  } catch (error) {
    console.error("Create Portfolio Error", error);
    res.status(500).json({ error: "Failed to create Portfolio" });
  }
};

export const getPortfolios = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    const userId = parseInt(req.user.id);
    if (isNaN(userId)) {
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }

    const portfolios = await portfolioService.getPortfolios(userId);
    res.json(portfolios);
  } catch (error) {
    console.error("Get Portfolios Error:", error);
    res.status(500).json({ error: "Failed to fetch portfolios" });
  }
};

export const getPortfolio = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = parseInt((req.user as any).id);
    const portfolioId = parseInt(req.params.id);
    const portfolio = await portfolioService.getPortfolio(userId, portfolioId);

    if (!portfolio) {
      res.status(404).json({ error: "Portfolio not Found" });
      return;
    }
    res.json({ message: "Fetched Portfolio", portfolio });
  } catch (error) {
    console.error("Get Portfolio Error:", error);
    res.status(500).json({ error: "Portfolio Not Found" });
  }
};

export const deletePortfolio = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = parseInt((req.user as any).id);
    const portfolioId = parseInt(req.params.id);
    await portfolioService.deletePortfolio(userId, portfolioId);
    res.status(200).json({ message: "Deleted Portfolio" });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: "Failed to Delete Portfolio" });
  }
};
