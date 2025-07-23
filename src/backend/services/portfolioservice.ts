import { CreatePortfolioDto } from "../types/portfolio";
import { prisma } from "../config/db";

export class PortfolioService {
  async createPortfolio(userId: number, data: CreatePortfolioDto) {
    return prisma.portfolios.create({
      data: {
        userId,
        name: data.name,
        startingBalance: data.startingBalance,
        riskScore: data.riskScore,
        createdAt: new Date(),
      },
      include: {
        holdings: true,
      },
    });
  }

  async getPortfolios(userId: number) {
    try {
      console.log('PortfolioService - Getting portfolios for userId:', userId);
      const result = await prisma.portfolios.findMany({
        where: { userId },
        include: {
          holdings: true,
        },
      });
      console.log('PortfolioService - Found portfolios:', JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.error('PortfolioService - Error fetching portfolios:', error);
      throw error;
    }
  }

  async getPortfolio(userId: number, portfolioId: number) {
    return prisma.portfolios.findFirst({
      where: {
        userId,
        id: portfolioId,
      },
      include: {
        holdings: true,
      },
    });
  }

  async deletePortfolio(userId: number, portfolioId: number) {
    const portfolio = await prisma.portfolios.findFirst({
      where: {
        id: portfolioId,
        userId,
      },
    });

    if (!portfolio) {
      throw new Error("Portfolio not found or access denied");
    }

    return prisma.portfolios.delete({
      where: {
        id: portfolioId,
      },
    });
  }
}
