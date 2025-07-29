import { CreatePortfolioDto } from "../types/portfolio";
import { prisma } from "../config/db";
import { NotFoundError } from "../utils/errors";
import { FinancialApiService } from "./financialApi";
import { TWELVE_DATA_API_KEY } from "../config/financialApi";

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

  // Calculate and store/update portfolio values from boughtAtDate to today
  /* 
  Input: Portfolio ID, boughtAtDate, asset details
  Process:
  For each day from boughtAtDate to today:
  Get historical price for the asset on that date
  Calculate: asset_price_on_date × shares
  Add this value to existing portfolio value for that date (or create new row)
  */
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
    // Validate portfolio exists and belongs to user
    const portfolio = await this.getPortfolio(userId, portfolioId);
    if (!portfolio) {
      throw new NotFoundError(
        "Portfolio does not exist or does not belong to user"
      );
    }

    try {
      // Get historical data for the asset from boughtAtDate to today
      const historicalData =
        await this.financialApiService.getAssetHistoricalData(
          assetData.symbol,
          assetData.boughtAtDate,
          new Date()
        );
      if (historicalData.length === 0) {
        throw new Error(`No historical data found for ${assetData.symbol}`);
      }

      // Get existing portfolio historical data
      const existingData =
        await prisma.portfolio_historical_performance.findMany({
          where: {
            portfolioId,
            date: {
              gte: assetData.boughtAtDate,
            },
          },
          orderBy: {
            date: "asc",
          },
        });

      // Process each historical data point
      for (const dataPoint of historicalData) {
        const date = new Date(dataPoint.date);
        const assetValue = dataPoint.price * assetData.shares;

        // Check if we already have data for this date
        const existingEntry = existingData.find(
          (entry) => entry.date.toISOString().split("T")[0] === dataPoint.date
        );

        if (existingEntry) {
          // Update existing entry by adding the new asset value
          await prisma.portfolio_historical_performance.update({
            where: { id: existingEntry.id },
            data: {
              totalValue: Number(existingEntry.totalValue) + assetValue,
              holdingsData: {
                ...(existingEntry.holdingsData as Record<string, any>),
                [assetData.symbol]: {
                  price: dataPoint.price,
                  shares: assetData.shares,
                  value: assetValue,
                },
              },
            },
          });
        } else {
          // Create new entry
          await prisma.portfolio_historical_performance.create({
            data: {
              portfolioId,
              date,
              totalValue: assetValue,
              holdingsData: {
                [assetData.symbol]: {
                  price: dataPoint.price,
                  shares: assetData.shares,
                  value: assetValue,
                },
              },
            },
          });
        }
      }

      return {
        success: true,
        message: "Historical data generated successfully",
      };
    } catch (error) {
      console.error("Error generating portfolio historical data:", error);
      throw error;
    }
  }

  // for charting purposes - when the user selects a timeRange it should fetch from the database with date indexing
  async getPortfolioHistoricalPerformance(
    userId: number,
    portfolioId: number,
    timeRange: string
  ) {}

  async getPortfolioChartData(portfolioId: number, timeRange: string) {}
}
