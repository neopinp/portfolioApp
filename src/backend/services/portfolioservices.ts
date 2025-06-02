import { PrismaClient } from "@prisma/client";
import { AddHoldingDto, CreatePortfolioDto } from "../types/portfolio";

export class PortfolioService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async createPortfolio(userId: number, data: CreatePortfolioDto) {
    return this.prisma.portfolios.create({
      data: {
        userId,
        name: data.name,
        starting_balance: data.startingBalance,
      },
      include: {
        holdings: true,
      },
    });
  }

  async getPortfolios(userId: number) {
    return this.prisma.portfolios.findMany({
      where: { userId },
      include: {
        holdings: true,
      },
    });
  }

  async getPortfolio(userId: number, portfolioId: number) {
    return this.prisma.portfolios.findFirst({
      where: {
        id: portfolioId,
        userId,
      },
    });
  }

  async addHolding(userId: number, portfolioId: number, data: AddHoldingDto) {
    const portfolio = await this.getPortfolio(userId, portfolioId);

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
    // check for the correct portfolio using portfolios relation fields

    const portfolio = await this.getPortfolio(userId, portfolioId);
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
    // check for the correct portfolio
    const portfolio = await this.getPortfolio(userId, portfolioId);

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

  async deletePortfolio(userId: number, portfolioId: number) {
    const portfolio = this.prisma.portfolios.findFirst({
      where: {
        id: portfolioId,
        userId,
      },
    });

    if (!portfolio) {
      throw new Error("Portfolio not found or access denied");
    }

    return this.prisma.portfolios.delete({
      where: {
        id: portfolioId,
      },
    });
  }
}
