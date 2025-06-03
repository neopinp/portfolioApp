import { PrismaClient } from "@prisma/client";
import { AddHoldingDto } from "../types/portfolio";
import { PortfolioService } from "./portfolioservices";

export class HoldingService {
  private prisma: PrismaClient;
  private portfolioService: PortfolioService;

  constructor() {
    this.prisma = new PrismaClient();
    this.portfolioService = new PortfolioService();
  }

  async addHolding(userId: number, portfolioId: number, data: AddHoldingDto) {
    const portfolio = await this.portfolioService.getPortfolio(userId, portfolioId);

    if (!portfolio) {
      throw new Error("Portfolio not found or does not belong to user");
    }

    return this.prisma.holdings.create({
      data: {
        portfolio_id: portfolioId,
        asset_symbol: data.symbol,
        amount: data.amount,
        bought_at_price: data.boughtAtPrice,
      },
    });
  }

  async removeHolding(userId: number, portfolioId: number, holdingId: number) {
    const portfolio = await this.portfolioService.getPortfolio(userId, portfolioId);
    if (!portfolio) {
      throw new Error("Portfolio not found or does not belong to user");
    }

    const holding = await this.prisma.holdings.findFirst({
      where: {
        id: holdingId,
        portfolio_id: portfolioId,
      },
    });
    if (!holding) {
      throw new Error("Holding not found");
    }

    await this.prisma.holdings.delete({
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
    const portfolio = await this.portfolioService.getPortfolio(userId, portfolioId);

    if (!portfolio) {
      throw new Error("Portfolio not found or does not belong to user");
    }
    const holding = await this.prisma.holdings.findFirst({
      where: {
        id: holdingId,
        portfolio_id: portfolioId,
      },
    });

    if (!holding) {
      throw new Error("Holding not found or access denied");
    }

    return this.prisma.holdings.update({
      where: {
        id: holdingId,
      },
      data: {
        amount: data.amount,
        bought_at_price: data.boughtAtPrice,
      },
    });
  }
}
