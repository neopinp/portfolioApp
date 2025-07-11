import Constants from 'expo-constants';

// API Configuration
export const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";
export const TWELVE_DATA_BASE_URL = "https://api.twelvedata.com";

// Get API Keys from environment variables
const getTwelveDataApiKey = (): string => {
  try {
    const apiKeyFromExpo = Constants.expoConfig?.extra?.TWELVE_DATA_API_KEY;
    if (apiKeyFromExpo && apiKeyFromExpo !== 'DEMO_KEY') {
      return apiKeyFromExpo;
    }
    if (process.env.TWELVE_DATA_API_KEY) {
      return process.env.TWELVE_DATA_API_KEY;
    }
    console.warn('⚠️ No valid TWELVE_DATA_API_KEY found');
    return 'DEMO_KEY';
  } catch (error) {
    console.error('Error getting Twelve Data API key:', error);
    return 'DEMO_KEY';
  }
};

const getFinnhubApiKey = (): string => {
  try {
    const apiKeyFromExpo = Constants.expoConfig?.extra?.FINNHUB_API_KEY;
    if (apiKeyFromExpo && apiKeyFromExpo !== 'DEMO_KEY') {
      return apiKeyFromExpo;
    }
    if (process.env.FINNHUB_API_KEY) {
      return process.env.FINNHUB_API_KEY;
    }
    console.warn('⚠️ No valid FINNHUB_API_KEY found');
    return 'DEMO_KEY';
  } catch (error) {
    console.error('Error getting Finnhub API key:', error);
    return 'DEMO_KEY';
  }
};

// Export the API keys
export const TWELVE_DATA_API_KEY = getTwelveDataApiKey();
export const FINNHUB_API_KEY = getFinnhubApiKey();

// Cache duration in milliseconds (5 minutes)
export const CACHE_DURATION = 5 * 60 * 1000;

// Rate limits
export const TWELVE_DATA_RATE_LIMIT = {
  maxCalls: 8,
  perMinute: 1
};

export const FINNHUB_RATE_LIMIT = {
  maxCalls: 30,
  perMinute: 1
}; 