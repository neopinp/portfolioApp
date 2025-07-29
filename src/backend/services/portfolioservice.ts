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
    console.log("PortfolioService - generatePortfolioHistoricalData called with:", {
      userId,
      portfolioId,
      assetData
    });

    // Validate portfolio exists and belongs to user
    const portfolio = await this.getPortfolio(userId, portfolioId);
    if (!portfolio) {
      console.log("PortfolioService - Portfolio not found");
      throw new NotFoundError(
        "Portfolio does not exist or does not belong to user"
      );
    }

    console.log("PortfolioService - Portfolio found:", portfolio.id);

    try {
      console.log("PortfolioService - Fetching data for:", assetData.symbol);
      
      // Check if boughtAtDate is today
      const today = new Date();
      const isToday = assetData.boughtAtDate.toDateString() === today.toDateString();
      
      let historicalData;
      
      if (isToday) {
        console.log("PortfolioService - Using Finnhub for current price (today's date)");
        // For today's date, get current price from Finnhub
        const currentPrice = await this.financialApiService.getQuote(assetData.symbol);
        if (!currentPrice) {
          throw new Error(`Failed to get current price for ${assetData.symbol}`);
        }
        historicalData = [{
          date: today.toISOString().split('T')[0],
          price: currentPrice.c
        }];
      } else {
        console.log("PortfolioService - Using Twelve Data for historical data (past date)");
        // For past dates, get historical data from Twelve Data
        historicalData = await this.financialApiService.getAssetHistoricalData(
          assetData.symbol,
          assetData.boughtAtDate,
          new Date()
        );
      }
      
      console.log("PortfolioService - Data received:", historicalData.length, "data points");
      
      if (historicalData.length === 0) {
        console.log("PortfolioService - No data found");
        throw new Error(`No data found for ${assetData.symbol}`);
      }

      console.log("PortfolioService - Fetching existing portfolio data");
      
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

      console.log("PortfolioService - Existing data found:", existingData.length, "entries");

      // Process each historical data point
      for (const dataPoint of historicalData) {
        const date = new Date(dataPoint.date);
        const assetValue = dataPoint.price * assetData.shares;

        // Check if we already have data for this date
        const existingEntry = existingData.find(
          (entry) => entry.date.toISOString().split("T")[0] === dataPoint.date
        );

        if (existingEntry) {
          console.log("PortfolioService - Updating existing entry for date:", dataPoint.date);
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
          console.log("PortfolioService - Creating new entry for date:", dataPoint.date);
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

      console.log("PortfolioService - Historical data generation completed successfully");
      return {
        success: true,
        message: "Historical data generated successfully",
      };
    } catch (error) {
      console.error("PortfolioService - Error generating portfolio historical data:", error);
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
