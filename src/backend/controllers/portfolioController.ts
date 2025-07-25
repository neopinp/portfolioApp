/* 
Create a new portfolio
Get all portfolios for a user
Get a single portfolio by ID
Delete a portfolio by ID

*/

import { Response } from "express";
import { AuthenticatedRequest } from "../types/auth";
import { services } from "../config/services";

// verifyToken is called before executing these routes and returns authenticatedRequest
// request body is the user's input
export const createPortfolio = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    console.log('Creating portfolio with body:', req.body);
    console.log('User:', req.user);

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
    const { name, startingBalance, riskScore } = req.body;
    console.log('Parsed fields:', { name, startingBalance, riskScore });

    if (!name || typeof name !== "string") {
      res.status(400).json({ error: "Missing Portfolio Name" });
      return;
    }
    if (
      !startingBalance ||
      typeof startingBalance !== "number" ||
      startingBalance < 0
    ) {
      res.status(400).json({
        error: "Starting balance is required and must be a positive number",
      });
      return;
    }
    if (typeof riskScore !== "number" || riskScore < 1 || riskScore > 10) {
      res
        .status(400)
        .json({ error: "Risk score must be a number between 1 and 10" });
      return;
    }

    console.log('Creating portfolio with data:', { userId, name, startingBalance, riskScore });
    const portfolio = await services.portfolio.createPortfolio(userId, {
      name,
      startingBalance,
      riskScore,
    });
    console.log('Created portfolio:', portfolio);
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
    console.log('Getting portfolios for user:', req.user);

    if (!req.user?.id) {
      console.log('No user ID found in request');
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    const userId = parseInt(req.user.id);
    if (isNaN(userId)) {
      console.log('Invalid user ID:', req.user.id);
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }

    console.log('Fetching portfolios for userId:', userId);
    const portfolios = await services.portfolio.getPortfolios(userId);
    console.log('Raw portfolios response:', JSON.stringify(portfolios, null, 2));
    res.json(portfolios);
  } catch (error) {
    console.error("Get Portfolios Error - Full error:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
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
    const portfolio = await services.portfolio.getPortfolio(
      userId,
      portfolioId
    );

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
    await services.portfolio.deletePortfolio(userId, portfolioId);
    res.status(200).json({ message: "Deleted Portfolio" });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: "Failed to Delete Portfolio" });
  }
};
