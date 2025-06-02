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
