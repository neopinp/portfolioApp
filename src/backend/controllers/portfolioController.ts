/* 
Create a new portfolio
Get all portfolios for a user
Get a single portfolio by ID
Delete a portfolio by ID
Add a holding to a portfolio
Update a holding in a portfolio
Remove a holding from a portfolio 
*/

import { Request, Response } from "express";
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
    const userId = parseInt((req.user as any).id);
    const portfolio = await portfolioService.createPortfolio(userId, req.body);
    res.json({ message: "Portfolio Created", portfolio });
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
    const userId = parseInt((req.user as any).id);
    const portfolios = await portfolioService.getPortfolios(userId);
    res.json(portfolios);
  } catch (error) {
    res.status(500).json({ error: "No Portfolios Found" });
  }
};

export const getPortfolio = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = parseInt((req.user as any).id); 
    const portfolioId = parseInt(req.params.id);
    const portfolio = portfolioService.getPortfolio(userId, portfolioId);

    if (!portfolio) {
      res.status(404).json({ error: "Portfolio not Found" });
      return;
    }
    res.json({ message: "Fetched Portfolio", portfolio });
  } catch (error) {
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
