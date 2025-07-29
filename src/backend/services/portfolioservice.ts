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
    const dates = historicalData.map(d => new Date(d.date));
    const existingEntries = await prisma.portfolio_historical_performance.findMany({
      where: {
        portfolioId,
        date: {
          in: dates,
        },
      },
    });

    // Create a map for quick lookup
    const existingEntriesMap = new Map(
      existingEntries.map(entry => [entry.date.toISOString().split('T')[0], entry])
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

  // for charting purposes - when the user selects a timeRange it should fetch from the database with date indexing
  async getPortfolioHistoricalPerformance(
    userId: number,
    portfolioId: number,
    timeRange: string
  ) {}

  async getPortfolioChartData(portfolioId: number, timeRange: string) {}
}
