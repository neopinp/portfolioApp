import { Asset } from "../types";
import {
  FINNHUB_BASE_URL,
  FINNHUB_API_KEY,
  CACHE_DURATION,
} from "../config/financialApi";

// Simple in-memory cache
interface CacheItem {
  data: any;
  timestamp: number;
}

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
 * Search for stocks by keywords
 */
export const searchAssets = async (query: string): Promise<Asset[]> => {
  if (!query || query.length < 1) return [];

  const cacheKey = `search_${query}`;
  const cachedData = getFromCache(cacheKey);
  if (cachedData) return cachedData;

  try {
    console.log(`Searching for assets with query: ${query}`);
    console.log(`Using API key: ${FINNHUB_API_KEY.substring(0, 3)}...`); // Log first few chars for debugging

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
        // Exclude symbols with international suffixes (e.g., .SW, .TSE, .L)
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

    // Limit to first 10 results to avoid rate limiting
    const limitedAssets = assets.slice(0, 5);

    // Fetch price data for the first 5 results
    const topAssets = limitedAssets.slice(0, 5);
    if (topAssets.length > 0) {
      const symbols = topAssets.map((asset) => asset.symbol);
      const detailedAssets = await getMultipleAssetDetails(symbols);

      // Update the price and change data for the top assets
      for (const detailedAsset of detailedAssets) {
        const index = limitedAssets.findIndex(
          (a) => a.symbol === detailedAsset.symbol
        );
        if (index !== -1) {
          limitedAssets[index] = {
            ...limitedAssets[index],
            price: detailedAsset.price,
            change: detailedAsset.change,
            fullName: detailedAsset.fullName || limitedAssets[index].fullName,
            sector: detailedAsset.sector,
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
 * Get asset details including current price and daily change
 */
export const getAssetDetails = async (
  symbol: string
): Promise<Asset | null> => {
  if (!symbol) return null;

  const cacheKey = `details_${symbol}`;
  const cachedData = getFromCache(cacheKey);
  if (cachedData) return cachedData;

  try {
    // Get quote data
    const quoteUrl = `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_API_KEY}`;
    const quoteResponse = await fetch(quoteUrl);
    const quoteData = await quoteResponse.json();

    if (!quoteData) {
      console.error("Missing API response for quote");
      return null;
    }

    // Check if this is a valid response with data
    // Note: c can be 0 for valid symbols with no current price data
    if (quoteData.c === undefined || quoteData.c === null) {
      console.error("Invalid API response format for quote:", quoteData);
      return null;
    }

    // Get company profile for additional info
    const profileUrl = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_API_KEY}`;
    const profileResponse = await fetch(profileUrl);
    const profileData = await profileResponse.json();

    // Get company metrics for additional data (market cap, P/E ratio, etc)
    const metricsUrl = `${FINNHUB_BASE_URL}/stock/metric?symbol=${encodeURIComponent(symbol)}&metric=all&token=${FINNHUB_API_KEY}`;
    const metricsResponse = await fetch(metricsUrl);
    const metricsData = await metricsResponse.json();

    const price = quoteData.c;
    const previousClose = quoteData.pc;
    const change = previousClose
      ? ((price - previousClose) / previousClose) * 100
      : 0;

    // Format market cap for display
    const formatMarketCap = (marketCap: number) => {
      if (!marketCap) return "N/A";
      
      // Finnhub typically returns market cap in millions
      const marketCapInDollars = marketCap * 1e6;
      
      if (marketCapInDollars >= 1e12) return `$${(marketCapInDollars / 1e12).toFixed(2)}T`;
      if (marketCapInDollars >= 1e9) return `$${(marketCapInDollars / 1e9).toFixed(2)}B`;
      if (marketCapInDollars >= 1e6) return `$${(marketCapInDollars / 1e6).toFixed(2)}M`;
      return `$${marketCapInDollars.toFixed(2)}`;
    };

    // Extract additional metrics
    const metrics = metricsData.metric || {};

    const asset: Asset = {
      symbol,
      name: profileData.name || symbol,
      fullName: profileData.name || symbol,
      price,
      change: parseFloat(change.toFixed(2)),
      riskScore: calculateRiskScore(profileData.finnhubIndustry),
      sector: profileData.finnhubIndustry,
      type: "Stock", // Default to Stock

      // Additional data
      marketCap: profileData.marketCapitalization
        ? formatMarketCap(profileData.marketCapitalization)
        : "N/A",
      sharesOutstanding: (() => {
        // Handle shares outstanding formatting
        if (!profileData.shareOutstanding) {
          // Try to get shares outstanding from metrics if not in profile
          const sharesFromMetrics =
            metrics.sharesOutstanding || metrics.commonStockSharesOutstanding;
          if (sharesFromMetrics) {
            // Finnhub typically returns shares in actual count
            if (sharesFromMetrics >= 1e9) {
              return `${(sharesFromMetrics / 1e9).toFixed(2)}B`;
            } else if (sharesFromMetrics >= 1e6) {
              return `${(sharesFromMetrics / 1e6).toFixed(2)}M`;
            } else if (sharesFromMetrics >= 1e3) {
              return `${(sharesFromMetrics / 1e3).toFixed(2)}K`;
            } else {
              return sharesFromMetrics.toFixed(2);
            }
          }
          return "N/A";
        }

        // Use profile data if available
        // Finnhub typically returns shareOutstanding in millions
        const shares = profileData.shareOutstanding * 1e6;
        
        if (shares >= 1e9) {
          return `${(shares / 1e9).toFixed(2)}B`;
        } else if (shares >= 1e6) {
          return `${(shares / 1e6).toFixed(2)}M`;
        } else if (shares >= 1e3) {
          return `${(shares / 1e3).toFixed(2)}K`;
        } else {
          return shares.toFixed(2);
        }
      })(),
      high52w: metrics["52WeekHigh"]
        ? `$${metrics["52WeekHigh"].toFixed(2)}`
        : "N/A",
      low52w: metrics["52WeekLow"]
        ? `$${metrics["52WeekLow"].toFixed(2)}`
        : "N/A",
      peRatio: metrics.peBasicExclExtraTTM
        ? metrics.peBasicExclExtraTTM.toFixed(2)
        : "N/A",
      eps: metrics.epsBasicExclExtraItemsTTM
        ? `$${metrics.epsBasicExclExtraItemsTTM.toFixed(2)}`
        : "N/A",
      beta: metrics.beta ? metrics.beta.toFixed(2) : "N/A",
      dividendYield: metrics.dividendYieldIndicatedAnnual
        ? `${(metrics.dividendYieldIndicatedAnnual).toFixed(2)}%`
        : "N/A",
      volume: quoteData.v ? quoteData.v.toLocaleString() : "N/A",
      avgVolume: metrics.averageDailyVolume10Day
        ? metrics.averageDailyVolume10Day.toLocaleString()
        : "N/A",
    };

    saveToCache(cacheKey, asset);
    return asset;
  } catch (error) {
    console.error("Error getting asset details:", error);
    return null;
  }
};

/**
 * Get multiple assets' details in batch
 */
export const getMultipleAssetDetails = async (
  symbols: string[]
): Promise<Asset[]> => {
  if (!symbols || symbols.length === 0) return [];

  const filteredSymbols = symbols.filter((symbol) => !symbol.includes("."));

  // Use Promise.all to fetch all assets in parallel
  const assetPromises = filteredSymbols.map((symbol) =>
    getAssetDetails(symbol)
  );
  const assets = await Promise.all(assetPromises);

  // Filter out null values
  return assets.filter((asset): asset is Asset => asset !== null);
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
