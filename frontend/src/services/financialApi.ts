import { Asset } from "../types";
import {
  FINNHUB_BASE_URL,
  FINNHUB_API_KEY,
  TWELVE_DATA_BASE_URL,
  TWELVE_DATA_API_KEY,
  CACHE_DURATION,
} from "../config/financialApi";
import { CacheItem } from "../types";

const cache: Record<string, CacheItem> = {};

/**
 * Get data from cache if it exists and is not expired
 */
const getFromCache = (key: string): any | null => {
  const item = cache[key];
  if (!item) return null;

  const now = Date.now();
  if (now - item.timestamp > CACHE_DURATION) {
    // Cache expired
    delete cache[key];
    return null;
  }

  return item.data;
};

/**
 * Save data to cache
 */
const saveToCache = (key: string, data: any): void => {
  cache[key] = {
    data,
    timestamp: Date.now(),
  };
};

/**
 * Search for stocks by keywords using Finnhub
 */
export const searchAssets = async (query: string): Promise<Asset[]> => {
  if (!query || query.length < 1) return [];

  const cacheKey = `search_${query}`;
  const cachedData = getFromCache(cacheKey);
  if (cachedData) return cachedData;

  try {
    console.log(`Searching for assets with query: ${query}`);

    const url = `${FINNHUB_BASE_URL}/search?q=${encodeURIComponent(query)}&token=${FINNHUB_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.result || !Array.isArray(data.result)) {
      console.error("Invalid API response:", data);
      return [];
    }

    // Create basic asset objects
    const assets: Asset[] = data.result
      .filter((item: any) => {
        // Only include US stocks and ETFs
        return item.symbol && !item.symbol.includes(".");
      })
      .map((item: any) => ({
        symbol: item.symbol,
        name: item.description,
        fullName: item.description,
        type: item.type,
        price: 0,
        change: 0,
        riskScore: calculateRiskScore(item.type),
      }));

    const limitedAssets = assets.slice(0, 5);

    // Fetch detailed data for each asset
    if (limitedAssets.length > 0) {
      const detailedAssets = await getMultipleAssetDetails(
        limitedAssets.map((asset) => asset.symbol)
      );

      // Update with detailed data
      for (const detailedAsset of detailedAssets) {
        const index = limitedAssets.findIndex(
          (a) => a.symbol === detailedAsset.symbol
        );
        if (index !== -1) {
          limitedAssets[index] = {
            ...limitedAssets[index],
            ...detailedAsset,
          };
        }
      }
    }

    saveToCache(cacheKey, limitedAssets);
    return limitedAssets;
  } catch (error) {
    console.error("Error searching assets:", error);
    return [];
  }
};

/**
 * Get asset details using Finnhub
 */
export const getAssetDetails = async (
  symbol: string
): Promise<Asset | null> => {
  if (!symbol) return null;

  const cacheKey = `details_${symbol}`;
  const cachedData = getFromCache(cacheKey);
  if (cachedData) return cachedData;

  try {
    // Get quote data from Finnhub
    const quoteUrl = `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_API_KEY}`;
    const quoteResponse = await fetch(quoteUrl);
    const quoteData = await quoteResponse.json();

    // Get company profile from Finnhub
    const profileUrl = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_API_KEY}`;
    const profileResponse = await fetch(profileUrl);
    const profileData = await profileResponse.json();

    // Get basic financials from Finnhub
    const metricsUrl = `${FINNHUB_BASE_URL}/stock/metric?symbol=${encodeURIComponent(symbol)}&metric=all&token=${FINNHUB_API_KEY}`;
    const metricsResponse = await fetch(metricsUrl);
    const metricsData = await metricsResponse.json();

    if (!quoteData || quoteData.c === undefined) {
      console.error("Invalid quote data:", quoteData);
      return null;
    }

    const price = quoteData.c;
    const previousClose = quoteData.pc;
    const change = previousClose
      ? ((price - previousClose) / previousClose) * 100
      : 0;

    const asset: Asset = {
      symbol,
      name: profileData.name || symbol,
      fullName: profileData.name || symbol,
      price,
      change: parseFloat(change.toFixed(2)),
      riskScore: calculateRiskScore(profileData.finnhubIndustry),
      sector: profileData.finnhubIndustry || "N/A",
      type: "Stock",

      // Additional data from Finnhub
      marketCap: profileData.marketCapitalization
        ? formatMarketCap(profileData.marketCapitalization * 1e6)
        : "N/A",
      sharesOutstanding: profileData.shareOutstanding
        ? formatShares(profileData.shareOutstanding * 1e6)
        : "N/A",
      high52w: metricsData.metric?.["52WeekHigh"]?.toFixed(2) || "N/A",
      low52w: metricsData.metric?.["52WeekLow"]?.toFixed(2) || "N/A",
      peRatio: metricsData.metric?.peBasicExclExtraTTM?.toFixed(2) || "N/A",
      eps: metricsData.metric?.epsBasicExclExtraItemsTTM
        ? `$${metricsData.metric.epsBasicExclExtraItemsTTM.toFixed(2)}`
        : "N/A",
      beta: metricsData.metric?.beta?.toFixed(2) || "N/A",
      dividendYield: metricsData.metric?.dividendYieldIndicatedAnnual
        ? `${metricsData.metric.dividendYieldIndicatedAnnual.toFixed(2)}%`
        : "N/A",
      volume: quoteData.v?.toLocaleString() || "N/A",
      avgVolume:
        metricsData.metric?.["10DayAverageTradingVolume"]?.toLocaleString() ||
        "N/A",
    };

    saveToCache(cacheKey, asset);
    return asset;
  } catch (error) {
    console.error("Error getting asset details:", error);
    return null;
  }
};

/**
 * Get HISTORICAL chart data using Twelve Data
 */
export const getAssetHistoricalData = async (
  symbol: string,
  timeRange: string
): Promise<{
  data: Array<{ timestamp: number; price: number }>;
  startDate: string;
  endDate: string;
} | null> => {
  if (!symbol) return null;

  const cacheKey = `chart_${symbol}_${timeRange}`;
  const cachedData = getFromCache(cacheKey);
  if (cachedData) return cachedData;

  try {
    const { interval, outputsize, startDate } = getTimeSeriesParams(timeRange);
    const endDate = new Date().toISOString().split("T")[0]; // Today's date

    let url = `${TWELVE_DATA_BASE_URL}/time_series?symbol=${encodeURIComponent(symbol)}&interval=${interval}&apikey=${TWELVE_DATA_API_KEY}`;

    // If we have a start date, use that instead of outputsize
    if (startDate) {
      url += `&start_date=${startDate}&end_date=${endDate}`;
    } else {
      url += `&outputsize=${outputsize}`;
    }

    console.log(
      `Fetching historical data for ${symbol} with interval ${interval}`
    );
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "error") {
      console.error("Twelve Data API error:", data.message);
      return null;
    }
    if (!data.values || !Array.isArray(data.values)) {
      console.error("Invalid time series response:", data);
      return null;
    }

    // CartesianChart Transformation
    const chartData = data.values.reverse().map((item: any, index: number) => ({
      timestamp: new Date(item.datetime).getTime(),
      price: parseFloat(item.close),
    }));
    /* 
      [
        {timestamp: 'Jul 1', price: 180.2}
        {timestamp: 'Jul 2', price: 181.5}
      ]
      */

    // Return chartData, endDate, startDate for the labels
    const actualStartDate =
      startDate ||
      (data.values.length > 0
        ? data.values[data.values.length - 1].datetime.split(" ")[0]
        : endDate);

    const result = {
      data: chartData,
      startDate: actualStartDate,
      endDate: endDate,
    };

    if (chartData.length > 0) {
      saveToCache(cacheKey, result);
    }

    return result;
  } catch (error) {
    console.error("Error fetching historical data:", error);
    return null;
  }
};

// Batching HISTORICAL Data (portfolio dashboard & portfolio screen) *IMPLEMENT*

// Helper function to get time series parameters
const getTimeSeriesParams = (
  timeRange: string
): { interval: string; outputsize: number; startDate?: string } => {
  const now = new Date();
  const startDate = new Date();

  switch (timeRange) {
    case "1D":
      // 1 day, 5-min intervals = 108 points
      return { interval: "5min", outputsize: 108 };

    case "1W":
      startDate.setDate(now.getDate() - 7);
      return {
        interval: "1h",
        outputsize: 168,
        startDate: startDate.toISOString().split("T")[0],
      };

    case "1M":
      startDate.setMonth(now.getMonth() - 1);
      return {
        interval: "1day",
        outputsize: 30,
        startDate: startDate.toISOString().split("T")[0],
      };

    case "3M":
      startDate.setMonth(now.getMonth() - 3);
      return {
        interval: "1day",
        outputsize: 66,
        startDate: startDate.toISOString().split("T")[0],
      };

    case "6M":
      startDate.setMonth(now.getMonth() - 6);
      return {
        interval: "1day",
        outputsize: 128,
        startDate: startDate.toISOString().split("T")[0],
      };

    case "1Y":
      startDate.setFullYear(now.getFullYear() - 1);
      return {
        interval: "1day",
        outputsize: 253,
        startDate: startDate.toISOString().split("T")[0],
      };

    case "5Y":
      startDate.setFullYear(now.getFullYear() - 5);
      return {
        interval: "1day",
        outputsize: 1000,
        startDate: startDate.toISOString().split("T")[0],
      };

    default:
      // Default to 30 days of daily data
      startDate.setDate(now.getDate() - 30);
      return {
        interval: "1day",
        outputsize: 30,
        startDate: startDate.toISOString().split("T")[0],
      };
  }
};

/**
 * Batching multiple asset details and assets FINNHUB - NOT HISTORICAL
 */
export const getMultipleAssetDetails = async (
  symbols: string[]
): Promise<Asset[]> => {
  if (!symbols || symbols.length === 0) return [];

  const assetPromises = symbols.map((symbol) => getAssetDetails(symbol));
  const assets = await Promise.all(assetPromises);

  return assets.filter((asset): asset is Asset => asset !== null);
};

// Helper function to format market cap
const formatMarketCap = (marketCap: number): string => {
  if (!marketCap) return "N/A";
  if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
  if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
  if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
  return `$${marketCap.toFixed(2)}`;
};

// Helper function to format shares outstanding
const formatShares = (shares: number): string => {
  if (!shares) return "N/A";
  if (shares >= 1e9) return `${(shares / 1e9).toFixed(2)}B`;
  if (shares >= 1e6) return `${(shares / 1e6).toFixed(2)}M`;
  if (shares >= 1e3) return `${(shares / 1e3).toFixed(2)}K`;
  return shares.toFixed(2);
};

/*
Calculate a risk score based on asset type and sector
*/
const calculateRiskScore = (typeOrSector: string = ""): number => {
  const normalized = typeOrSector.toLowerCase();

  // Higher risk sectors/types
  if (
    normalized.includes("crypto") ||
    normalized.includes("technology") ||
    normalized.includes("biotech")
  ) {
    return 8;
  }

  // Medium-high risk
  if (
    normalized.includes("etf") &&
    (normalized.includes("growth") || normalized.includes("small cap"))
  ) {
    return 7;
  }

  // Medium risk
  if (
    normalized.includes("consumer") ||
    normalized.includes("industrial") ||
    normalized.includes("equity")
  ) {
    return 6;
  }

  // Medium-low risk
  if (
    normalized.includes("etf") ||
    normalized.includes("dividend") ||
    normalized.includes("healthcare")
  ) {
    return 5;
  }

  // Lower risk
  if (
    normalized.includes("bond") ||
    normalized.includes("utility") ||
    normalized.includes("treasury")
  ) {
    return 3;
  }

  // Default - medium risk
  return 5;
};
