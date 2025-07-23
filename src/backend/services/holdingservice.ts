import { prisma } from "../config/db";
import { AddHoldingDto } from "../types/portfolio";
import { PortfolioService } from "./portfolioservice";
import { FinancialService } from "./financialservice";
import { NotFoundError, InsufficientFundsError } from "../utils/errors";

export class HoldingService {
  constructor(
    private readonly portfolioService: PortfolioService,
    private readonly financialService: FinancialService
  ) {}

  // NEED A GET HOLDINGS SERVICE TO DISPLAY ALL TRANSACTIONS FOR A SPECIFIC ASSET SYMBOL WHEN SELECTED
  async simulateHolding(
    userId: number,
    portfolioId: number,
    data: AddHoldingDto
  ) {
    const portfolio = await this.portfolioService.getPortfolio(
      userId,
      portfolioId
    );

    if (!portfolio) {
      throw new NotFoundError("Portfolio not found or does not belong to user");
    }

    return prisma.holdings.create({
      data: {
        portfolioId: portfolioId,
        assetSymbol: data.symbol,
        amount: data.amount,
        boughtAtPrice: data.boughtAtPrice,
        createdAt: new Date(),
      },
    });
  }

  // CURRENT DAY financial services
  async addHolding(userId: number, portfolioId: number, holdingId: number) {} // * ADD IN *

  async removeHolding(userId: number, portfolioId: number, holdingId: number) {
    const portfolio = await this.portfolioService.getPortfolio(
      userId,
      portfolioId
    );
    if (!portfolio) {
      throw new NotFoundError("Portfolio not found or does not belong to user");
    }

    const holding = await prisma.holdings.findFirst({
      where: {
        id: holdingId,
        portfolioId: portfolioId,
      },
    });
    if (!holding) {
      throw new NotFoundError("Holding not found");
    }

    await prisma.holdings.delete({
      where: {
        id: holdingId,
      },
    });
    return { message: "Holding Removed" };
  }

  async updateHolding(
    userId: number,
    portfolioId: number,
    holdingId: number,
    data: Partial<AddHoldingDto>
  ) {
    const portfolio = await this.portfolioService.getPortfolio(
      userId,
      portfolioId
    );

    if (!portfolio) {
      throw new NotFoundError("Portfolio not found or does not belong to user");
    }
    const holding = await prisma.holdings.findFirst({
      where: {
        id: holdingId,
        portfolioId: portfolioId,
      },
    });

    if (!holding) {
      throw new NotFoundError("Holding not found or access denied");
    }

    return prisma.holdings.update({
      where: {
        id: holdingId,
      },
      data: {
        amount: data.amount,
        boughtAtPrice: data.boughtAtPrice,
      },
    });
  }
}
