import { prisma } from "../config/db";
import { AddHoldingDto } from "../types/portfolio";
import { PortfolioService } from "./portfolioservice";
import { FinancialApiService } from "./financialApi";
import { NotFoundError } from "../utils/errors";
import { subDays, subMonths, subWeeks, subYears } from "date-fns";

export class HoldingService {
  constructor(
    private readonly portfolioService: PortfolioService,
    private readonly financialApiService: FinancialApiService
  ) {}

  // Private helper method to validate portfolio access
  private async validatePortfolioAccess(userId: number, portfolioId: number) {
    const portfolio = await this.portfolioService.getPortfolio(
      userId,
      portfolioId
    );
    if (!portfolio) {
      throw new NotFoundError("Portfolio not found or does not belong to user");
    }
    return portfolio;
  }

  // for simulation buying and current buying
  async addHolding(userId: number, portfolioId: number, data: AddHoldingDto) {
    await this.validatePortfolioAccess(userId, portfolioId);

    return prisma.holdings.create({
      data: {
        portfolioId: portfolioId,
        assetSymbol: data.symbol,
        amount: data.amount,
        boughtAtPrice: data.boughtAtPrice,
        boughtAtDate: data.boughtAtDate,
        createdAt: new Date(),
      },
    });
  }

  async removeHolding(userId: number, portfolioId: number, holdingId: number) {
    await this.validatePortfolioAccess(userId, portfolioId);

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
    await this.validatePortfolioAccess(userId, portfolioId);

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

  // Per holding overview in holdings list - {Total Shares Held, Weighted Average Cost Basis}
  async getHoldingsAggregated(userId: number, portfolioId: number) {
    await this.validatePortfolioAccess(userId, portfolioId);

    // First get all holdings for the portfolio
    const holdings = await prisma.holdings.findMany({
      where: {
        portfolioId,
      },
      select: {
        assetSymbol: true,
        amount: true,
        boughtAtPrice: true,
      },
    });

    // Calculate weighted averages and totals per symbol
    const aggregatedBySymbol = holdings.reduce(
      (acc, holding) => {
        const symbol = holding.assetSymbol;
        const amount = Number(holding.amount);
        const price = Number(holding.boughtAtPrice);

        if (!acc[symbol]) {
          acc[symbol] = {
            totalAmount: 0,
            weightedSum: 0,
          };
        }

        acc[symbol].totalAmount += amount;
        acc[symbol].weightedSum += amount * price;

        return acc;
      },
      {} as Record<string, { totalAmount: number; weightedSum: number }>
    );
    return Object.entries(aggregatedBySymbol).map(([symbol, data]) => ({
      assetSymbol: symbol,
      _sum: {
        amount: data.totalAmount,
      },
      _avg: {
        boughtAtPrice: data.weightedSum / data.totalAmount,
      },
    }));
  }

  // {Transaction Dates / Amounts} - EXPANDED version of each holding
  // Build histroical performance charts
  async getHoldingsBySymbol(
    userId: number,
    portfolioId: number,
    symbol: string
  ) {
    await this.validatePortfolioAccess(userId, portfolioId);

    return prisma.holdings.findMany({
      where: {
        portfolioId,
        assetSymbol: symbol,
      },
      orderBy: {
        boughtAtDate: "desc",
      },
    });
  }

  // All transactions + live prices for total portfolio value
  async getHoldingPerformance(
    userId: number,
    portfolioId: number,
    symbol?: string
  ) {
    await this.validatePortfolioAccess(userId, portfolioId);

    const whereClause = {
      portfolioId,
      ...(symbol && { assetSymbol: symbol }),
    };

    const holdings = await prisma.holdings.findMany({
      where: whereClause,
      select: {
        assetSymbol: true,
        amount: true,
        boughtAtPrice: true,
        boughtAtDate: true,
      },
      orderBy: {
        boughtAtDate: "asc",
      },
    });

    // Get unique symbols to fetch current prices
    const symbols = [...new Set(holdings.map((h) => h.assetSymbol))];
    const currentPrices =
      await this.financialApiService.getMultipleQuotes(symbols);

    // Add current prices to holdings data
    return holdings.map((holding) => ({
      ...holding,
      currentPrice:
        currentPrices.get(holding.assetSymbol) ||
        Number(holding.boughtAtPrice) ||
        0,
    }));
  }

  /* Bundle Holdings + Aggregated Data {getHoldingPerformance + getHoldingsAggregated} */
  async getPortfolioAnalytics(userId: number, portfolioId: number) {
    const holdings = await this.getHoldingPerformance(userId, portfolioId);
    const aggregated = await this.getHoldingsAggregated(userId, portfolioId);

    return {
      holdings,
      aggregated,
    };
  }

  // Helper Function
  getStartDateForRange = (
    timeRange: "1D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "5Y"
  ): Date => {
    const now = new Date();
    switch (timeRange) {
      case "1D":
        return subDays(now, 1);
      case "1W":
        return subWeeks(now, 1);
      case "3M":
        return subMonths(now, 3);
      case "6M":
        return subMonths(now, 6);
      case "1Y":
        return subYears(now, 1);
      case "5Y":
        return subYears(now, 5);
      default:
        return subMonths(now, 1);
    }
  };

  // get snapshots overtime for charting
  async getPortfolioHistory(
    userId: number,
    portfolioId: number,
    timeRange: "1D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "5Y"
  ) {
    await this.validatePortfolioAccess(userId, portfolioId);

    return prisma.portfolio_snapshots.findMany({
      where: {
        portfolioId,
        snapshotDate: {
          gte: this.getStartDateForRange(timeRange),
        },
      },
      orderBy: {
        snapshotDate: "asc",
      },
    });
  }

  // Check if a snapshot is needed for today
  async needsSnapshot(userId: number, portfolioId: number): Promise<boolean> {
    await this.validatePortfolioAccess(userId, portfolioId);

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const existingSnapshot = await prisma.portfolio_snapshots.findFirst({
      where: {
        portfolioId,
        snapshotDate: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000), // End of today
        },
      },
    });

    return !existingSnapshot;
  }

  // Get the last snapshot date for a portfolio
  async getLastSnapshotDate(
    userId: number,
    portfolioId: number
  ): Promise<Date | null> {
    await this.validatePortfolioAccess(userId, portfolioId);

    const lastSnapshot = await prisma.portfolio_snapshots.findFirst({
      where: { portfolioId },
      orderBy: { snapshotDate: "desc" },
      select: { snapshotDate: true },
    });

    return lastSnapshot?.snapshotDate || null;
  }

  // Save current total portfolio value w/ live prices
  async createPortfolioSnapshot(userId: number, portfolioId: number) {
    await this.validatePortfolioAccess(userId, portfolioId);

    // Check if a snapshot already exists for today
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const existingSnapshot = await prisma.portfolio_snapshots.findFirst({
      where: {
        portfolioId,
        snapshotDate: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000), // End of today
        },
      },
    });

    if (existingSnapshot) {
      console.log(
        `Snapshot already exists for portfolio ${portfolioId} on ${today.toDateString()}`
      );
      return existingSnapshot;
    }

    // Get current holdings with live prices already included
    const holdings = await this.getHoldingPerformance(userId, portfolioId);

    // Calculate total portfolio value using the currentPrice from getHoldingPerformance
    let totalValue = 0;
    for (const holding of holdings) {
      const currentPrice =
        holding.currentPrice || Number(holding.boughtAtPrice) || 0;
      const amount = Number(holding.amount);
      totalValue += currentPrice * amount;
    }

    // Get previous snapshot for daily change calculation
    const previousSnapshot = await prisma.portfolio_snapshots.findFirst({
      where: { portfolioId },
      orderBy: { snapshotDate: "desc" },
    });

    // Calculate daily change and percentage
    let dailyChange = 0;
    let dailyChangePercent = 0;

    if (previousSnapshot && Number(previousSnapshot.totalValue) > 0) {
      const previousValue = Number(previousSnapshot.totalValue);
      dailyChange = totalValue - previousValue;
      dailyChangePercent = (dailyChange / previousValue) * 100;
    }

    return prisma.portfolio_snapshots.create({
      data: {
        portfolioId,
        totalValue,
        dailyChange,
        dailyChangePercent,
        snapshotDate: new Date(),
      },
    });
  }

  // compute stats (max, total change) over snapshot history
  async getSnapshotAggregated(
    userId: number,
    portfolioId: number,
    timeRange: "1D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "5Y"
  ) {
    const snapshots = await this.getPortfolioHistory(
      userId,
      portfolioId,
      timeRange
    );

    return {
      highestValue: Math.max(...snapshots.map((s) => Number(s.totalValue))),
      lowestValue: Math.min(...snapshots.map((s) => Number(s.totalValue))),
      averageValue:
        snapshots.reduce((acc, s) => acc + Number(s.totalValue), 0) /
        snapshots.length,
      totalChange:
        snapshots.length > 1
          ? ((Number(snapshots[snapshots.length - 1].totalValue) -
              Number(snapshots[0].totalValue)) /
              Number(snapshots[0].totalValue)) *
            100
          : 0,
    };
  }
}
