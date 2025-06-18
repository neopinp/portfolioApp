import { Asset } from '../types';
import { 
  FINNHUB_BASE_URL, 
  FINNHUB_API_KEY,
  CACHE_DURATION 
} from '../config/financialApi';

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
    timestamp: Date.now()
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
      console.error('Invalid API response:', data);
      return [];
    }
    
    const assets: Asset[] = data.result.map((item: any) => ({
      symbol: item.symbol,
      name: item.description,
      fullName: item.description,
      type: item.type,
      price: 0, // Will be populated later
      change: 0, // Will be populated later
      riskScore: calculateRiskScore(item.type), // Simple risk score calculation
    }));
    
    saveToCache(cacheKey, assets);
    return assets;
  } catch (error) {
    console.error('Error searching assets:', error);
    return [];
  }
};

/**
 * Get asset details including current price and daily change
 */
export const getAssetDetails = async (symbol: string): Promise<Asset | null> => {
  if (!symbol) return null;
  
  const cacheKey = `details_${symbol}`;
  const cachedData = getFromCache(cacheKey);
  if (cachedData) return cachedData;
  
  try {
    // Get quote data
    const quoteUrl = `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_API_KEY}`;
    const quoteResponse = await fetch(quoteUrl);
    const quoteData = await quoteResponse.json();
    
    if (!quoteData || !quoteData.c) {
      console.error('Invalid API response for quote:', quoteData);
      return null;
    }
    
    // Get company profile for additional info
    const profileUrl = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_API_KEY}`;
    const profileResponse = await fetch(profileUrl);
    const profileData = await profileResponse.json();
    
    const price = quoteData.c;
    const previousClose = quoteData.pc;
    const change = previousClose ? ((price - previousClose) / previousClose) * 100 : 0;
    
    const asset: Asset = {
      symbol,
      name: profileData.name || symbol,
      fullName: profileData.name || symbol,
      price,
      change: parseFloat(change.toFixed(2)),
      riskScore: calculateRiskScore(profileData.finnhubIndustry),
      sector: profileData.finnhubIndustry,
      type: 'Stock', // Default to Stock
    };
    
    saveToCache(cacheKey, asset);
    return asset;
  } catch (error) {
    console.error('Error getting asset details:', error);
    return null;
  }
};

/**
 * Get multiple assets' details in batch
 */
export const getMultipleAssetDetails = async (symbols: string[]): Promise<Asset[]> => {
  if (!symbols || symbols.length === 0) return [];
  
  // Use Promise.all to fetch all assets in parallel
  const assetPromises = symbols.map(symbol => getAssetDetails(symbol));
  const assets = await Promise.all(assetPromises);
  
  // Filter out null values
  return assets.filter((asset): asset is Asset => asset !== null);
};

/**
 * Calculate a risk score based on asset type and sector
 * This is a simplified approach - in a real app, you'd use more sophisticated metrics
 */
const calculateRiskScore = (typeOrSector: string = ''): number => {
  const normalized = typeOrSector.toLowerCase();
  
  // Higher risk sectors/types
  if (
    normalized.includes('crypto') || 
    normalized.includes('technology') || 
    normalized.includes('biotech')
  ) {
    return 8;
  }
  
  // Medium-high risk
  if (
    normalized.includes('etf') && 
    (normalized.includes('growth') || normalized.includes('small cap'))
  ) {
    return 7;
  }
  
  // Medium risk
  if (
    normalized.includes('consumer') || 
    normalized.includes('industrial') ||
    normalized.includes('equity')
  ) {
    return 6;
  }
  
  // Medium-low risk
  if (
    normalized.includes('etf') || 
    normalized.includes('dividend') || 
    normalized.includes('healthcare')
  ) {
    return 5;
  }
  
  // Lower risk
  if (
    normalized.includes('bond') || 
    normalized.includes('utility') || 
    normalized.includes('treasury')
  ) {
    return 3;
  }
  
  // Default - medium risk
  return 5;
}; 