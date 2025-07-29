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

  // Update current portfolio value for today's trading (real trading mode)
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
      console.log("PortfolioService - Fetching current price for:", assetData.symbol);
      
      // Get current price from Finnhub
      const currentPrice = await this.financialApiService.getQuote(assetData.symbol);
      if (!currentPrice) {
        throw new Error(`Failed to get current price for ${assetData.symbol}`);
      }

      const today = new Date();
      const assetValue = assetData.price * assetData.shares;  // Use user's input price, not market price

      console.log("PortfolioService - User input price:", assetData.price, "Asset value:", assetValue);

      // Check if we already have data for today
      const existingEntry = await prisma.portfolio_historical_performance.findFirst({
        where: {
          portfolioId,
          date: today,
        },
      });

      console.log("PortfolioService - Looking for existing entry for today:", today.toISOString().split('T')[0]);
      console.log("PortfolioService - Found existing entry:", !!existingEntry);
      if (existingEntry) {
        console.log("PortfolioService - Existing entry date:", existingEntry.date.toISOString().split('T')[0]);
        console.log("PortfolioService - Existing total value:", existingEntry.totalValue);
      }

      if (existingEntry) {
        console.log("PortfolioService - Updating existing entry for today");
        console.log("PortfolioService - Existing total value:", existingEntry.totalValue);
        console.log("PortfolioService - New asset value:", assetValue);
        
        // Update existing entry by adding the new asset value
        await prisma.portfolio_historical_performance.update({
          where: { id: existingEntry.id },
          data: {
            totalValue: Number(existingEntry.totalValue) + assetValue,
            holdingsData: {
              ...(existingEntry.holdingsData as Record<string, any>),
              [assetData.symbol]: {
                price: assetData.price,  // Use user's input price
                shares: assetData.shares,
                value: assetValue,
              },
            },
          },
        });
        
        console.log("PortfolioService - Updated total value:", Number(existingEntry.totalValue) + assetValue);
      } else {
        console.log("PortfolioService - Creating new entry for today");
        // Create new entry for today
        await prisma.portfolio_historical_performance.create({
          data: {
            portfolioId,
            date: today,
            totalValue: assetValue,
            holdingsData: {
              [assetData.symbol]: {
                price: assetData.price,  // Use user's input price
                shares: assetData.shares,
                value: assetValue,
              },
            },
          },
        });
      }

      console.log("PortfolioService - Current value update completed successfully");
      return {
        success: true,
        message: "Current portfolio value updated successfully",
      };
    } catch (error) {
      console.error("PortfolioService - Error updating current portfolio value:", error);
      throw error;
    }
  }

  // Calculate and store/update portfolio values from boughtAtDate to today (simulation mode)
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
      console.log("PortfolioService - Fetching historical data for:", assetData.symbol);
      
      // Get historical data from Twelve Data (for past dates only)
      const historicalData = await this.financialApiService.getAssetHistoricalData(
        assetData.symbol,
        assetData.boughtAtDate,
        new Date()
      );
      
      console.log("PortfolioService - Historical data received:", historicalData.length, "data points");
      
      if (historicalData.length === 0) {
        console.log("PortfolioService - No historical data found");
        throw new Error(`No historical data found for ${assetData.symbol}`);
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

      const today = new Date();
      
      // Check if today's date is included in the historical data
      const hasToday = historicalData.some(dataPoint => 
        dataPoint.date === today.toISOString().split('T')[0]
      );
      
      // If today's date is not in historical data, add it manually
      if (!hasToday) {
        console.log("PortfolioService - Adding today's date to processing list");
        historicalData.push({
          date: today.toISOString().split('T')[0],
          price: 0 // Will be replaced with current price
        });
      }

      // Process each historical data point
      for (const dataPoint of historicalData) {
        const date = new Date(dataPoint.date);
        const isToday = dataPoint.date === today.toISOString().split('T')[0];
        
        console.log("PortfolioService - Processing date:", dataPoint.date, "Is today:", isToday);
        
        let assetValue;
        let price;
        
        if (isToday) {
          console.log("PortfolioService - Processing today's date, using Finnhub for current price");
          // For today's date, get current price from Finnhub
          const currentPrice = await this.financialApiService.getQuote(assetData.symbol);
          if (!currentPrice) {
            throw new Error(`Failed to get current price for ${assetData.symbol}`);
          }
          price = currentPrice.c;
          assetValue = price * assetData.shares;
          console.log("PortfolioService - Current price from Finnhub:", price, "Asset value:", assetValue);
        } else {
          console.log("PortfolioService - Processing historical date:", dataPoint.date);
          // For historical dates, use the historical price
          price = dataPoint.price;
          assetValue = price * assetData.shares;
        }

        // Check if we already have data for this date
        let existingEntry = existingData.find(
          (entry) => entry.date.toISOString().split("T")[0] === dataPoint.date
        );

        // If it's today and we didn't find it in existingData, check the database directly
        if (isToday && !existingEntry) {
          console.log("PortfolioService - Checking database directly for today's entry");
          const todayEntry = await prisma.portfolio_historical_performance.findFirst({
            where: {
              portfolioId,
              date: today,
            },
          });
          if (todayEntry) {
            existingEntry = todayEntry;
          }
        }

        if (existingEntry) {
          console.log("PortfolioService - Updating existing entry for date:", dataPoint.date);
          console.log("PortfolioService - Existing total value:", existingEntry.totalValue);
          console.log("PortfolioService - New asset value:", assetValue);
          
          // Update existing entry by adding the new asset value
          await prisma.portfolio_historical_performance.update({
            where: { id: existingEntry.id },
            data: {
              totalValue: Number(existingEntry.totalValue) + assetValue,
              holdingsData: {
                ...(existingEntry.holdingsData as Record<string, any>),
                [assetData.symbol]: {
                  price: price,
                  shares: assetData.shares,
                  value: assetValue,
                },
              },
            },
          });
          
          console.log("PortfolioService - Updated total value:", Number(existingEntry.totalValue) + assetValue);
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
                  price: price,
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
