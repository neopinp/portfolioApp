import { CreatePortfolioDto } from "../types/portfolio";
import { prisma } from "../config/db";
import { NotFoundError } from "../utils/errors";
import { FinancialApiService } from "./financialApi";

export class PortfolioService {
  constructor(private readonly financialApiService: FinancialApiService) {}

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
      console.log("PortfolioService - Getting portfolios for userId:", userId);
      const result = await prisma.portfolios.findMany({
        where: { userId },
        include: {
          holdings: true,
        },
      });
      console.log(
        "PortfolioService - Found portfolios:",
        JSON.stringify(result, null, 2)
      );
      return result;
    } catch (error) {
      console.error("PortfolioService - Error fetching portfolios:", error);
      throw error;
    }
  }

  // already functions the same as getHoldings method - general holdings view in the portfolioscreen/dashboard
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

  private async upsertHistoricalValue(
    portfolioId: number,
    date: Date,
    symbol: string,
    shares: number,
    price: number
  ): Promise<void> {
    const assetValue = price * shares;

    const existingEntry =
      await prisma.portfolio_historical_performance.findFirst({
        where: {
          portfolioId,
          date,
        },
      });

    if (existingEntry) {
      await prisma.portfolio_historical_performance.update({
        where: { id: existingEntry.id },
        data: {
          totalValue: Number(existingEntry.totalValue) + assetValue,
          holdingsData: {
            ...(existingEntry.holdingsData as Record<string, any>),
            [symbol]: {
              price,
              shares,
              value: assetValue,
            },
          },
        },
      });
    } else {
      await prisma.portfolio_historical_performance.create({
        data: {
          portfolioId,
          date,
          totalValue: assetValue,
          holdingsData: {
            [symbol]: {
              price,
              shares,
              value: assetValue,
            },
          },
        },
      });
    }
  }
  async updatePortfolioCurrentValue(
    userId: number,
    portfolioId: number,
    assetData: {
      symbol: string;
      shares: number;
      price: number;
    }
  ) {
    console.log("PortfolioService - updatePortfolioCurrentValue called with:", {
      userId,
      portfolioId,
      assetData,
    });

    const portfolio = await this.getPortfolio(userId, portfolioId);
    if (!portfolio) {
      throw new NotFoundError(
        "Portfolio does not exist or does not belong to user"
      );
    }

    const today = new Date();

    await this.upsertHistoricalValue(
      portfolioId,
      today,
      assetData.symbol,
      assetData.shares,
      assetData.price
    );

    console.log(
      "PortfolioService - Current value update completed successfully"
    );

    return {
      success: true,
      message: "Current portfolio value updated successfully",
    };
  }
  async generatePortfolioHistoricalData(
    userId: number,
    portfolioId: number,
    assetData: {
      symbol: string;
      shares: number;
      price: number;
      boughtAtDate: Date;
    }
  ) {
    console.log(
      "PortfolioService - generatePortfolioHistoricalData called with:",
      {
        userId,
        portfolioId,
        assetData,
      }
    );

    const portfolio = await this.getPortfolio(userId, portfolioId);
    if (!portfolio) {
      throw new NotFoundError(
        "Portfolio does not exist or does not belong to user"
      );
    }

    const historicalData =
      await this.financialApiService.getAssetHistoricalData(
        assetData.symbol,
        assetData.boughtAtDate,
        new Date()
      );

    if (historicalData.length === 0) {
      throw new Error(`No historical data found for ${assetData.symbol}`);
    }

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    const hasToday = historicalData.some((d) => d.date === todayStr);
    if (!hasToday) {
      historicalData.push({ date: todayStr, price: 0 }); // Placeholder to fill with real price
    }

    // Batch fetch existing entries for all dates at once
    const dates = historicalData.map((d) => new Date(d.date));
    const existingEntries =
      await prisma.portfolio_historical_performance.findMany({
        where: {
          portfolioId,
          date: {
            in: dates,
          },
        },
      });

    // Create a map for quick lookup
    const existingEntriesMap = new Map(
      existingEntries.map((entry) => [
        entry.date.toISOString().split("T")[0],
        entry,
      ])
    );

    // Prepare batch operations
    const operations = [];

    for (const dataPoint of historicalData) {
      const date = new Date(dataPoint.date);
      const isToday = dataPoint.date === todayStr;

      let price: number;

      if (isToday) {
        const currentQuote = await this.financialApiService.getQuote(
          assetData.symbol
        );
        if (!currentQuote) {
          throw new Error(
            `Failed to fetch current price for ${assetData.symbol}`
          );
        }
        price = currentQuote.c;
      } else {
        price = dataPoint.price;
      }

      const assetValue = price * assetData.shares;
      const existingEntry = existingEntriesMap.get(dataPoint.date);

      if (existingEntry) {
        // Update existing entry
        operations.push(
          prisma.portfolio_historical_performance.update({
            where: { id: existingEntry.id },
            data: {
              totalValue: Number(existingEntry.totalValue) + assetValue,
              holdingsData: {
                ...(existingEntry.holdingsData as Record<string, any>),
                [assetData.symbol]: {
                  price,
                  shares: assetData.shares,
                  value: assetValue,
                },
              },
            },
          })
        );
      } else {
        // Create new entry
        operations.push(
          prisma.portfolio_historical_performance.create({
            data: {
              portfolioId,
              date,
              totalValue: assetValue,
              holdingsData: {
                [assetData.symbol]: {
                  price,
                  shares: assetData.shares,
                  value: assetValue,
                },
              },
            },
          })
        );
      }
    }

    // Execute all operations in a single transaction
    await prisma.$transaction(operations);

    console.log(
      "PortfolioService - Historical data generation completed successfully"
    );

    return {
      success: true,
      message: "Historical data generated successfully",
    };
  }

  // retrieve and transform the chart data
  async getPortfolioChartData(
    userId: number,
    portfolioId: number,
    timeRange: string
  ) {
    const portfolio = await this.getPortfolio(userId, portfolioId);

    if (!portfolio) {
      throw new NotFoundError("Portfolio not found or does not belong to user");
    }

    const endDate = new Date();
    const requestedStartDate = this.getStartDatefromTimeRange(timeRange);

    // find the earliest available data point for this portfolio
    const earliestDataPoint =
      await prisma.portfolio_historical_performance.findFirst({
        where: {
          portfolioId,
        },
        orderBy: {
          date: "asc",
        },
      });

    if (!earliestDataPoint) {
      return {
        data: [],
        startDate: requestedStartDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        change: 0,
        changePercent: 0,
      };
    }

    // earliest available date
    const startDate = new Date(
      Math.min(requestedStartDate.getTime(), earliestDataPoint.date.getTime())
    );

    // Query the historical performance data with adjusted date range
    const historicalData =
      await prisma.portfolio_historical_performance.findMany({
        where: {
          portfolioId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          date: "asc",
        },
      });

    // Format the data for the TimeSeriesChart component
    const chartData = historicalData.map((entry) => ({
      timestamp: entry.date.getTime(),
      price: Number(entry.totalValue),
    }));

    let change = 0;
    let changePercent = 0;

    if (chartData.length >= 2) {
      const firstValue = chartData[0].price;
      const lastValue = chartData[chartData.length - 1].price;

      change = lastValue - firstValue;
      changePercent = (change / firstValue) * 100;
    }

    return {
      data: chartData,
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      change,
      changePercent: parseFloat(changePercent.toFixed(2)),
      // Add a flag to indicate if we're using a limited date range
      isDateRangeLimited: startDate > requestedStartDate,
      requestedTimeRange: timeRange,
    };
  }

  private getStartDatefromTimeRange(timeRange: string): Date {
    const now = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case "1D":
        startDate.setDate(now.getDate() - 1);
        break;
      case "1W":
        startDate.setDate(now.getDate() - 7);
        break;
      case "1M":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "3M":
        startDate.setMonth(now.getMonth() - 3);
        break;
      case "6M":
        startDate.setMonth(now.getMonth() - 6);
        break;
      case "1Y":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case "5Y":
        startDate.setFullYear(now.getFullYear() - 5);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1); // Default to 1 month
    }

    return startDate;
  }
}
