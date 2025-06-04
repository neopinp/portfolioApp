import { PrismaClient } from "@prisma/client";
import { CreatePortfolioDto } from "../types/portfolio";

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
        userId,
        id: portfolioId
      },
      include: {
        holdings: true
      }
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
