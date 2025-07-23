import { PortfolioService } from "./portfolioservice";
import { prisma } from "../config/db";

export class FinancialService {
  constructor(private readonly portfolioService: PortfolioService) {}
}

// only for retrieving current data from TwelveData API



