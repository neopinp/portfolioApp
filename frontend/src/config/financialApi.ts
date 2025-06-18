import Constants from 'expo-constants';

// Finnhub API Configuration
// Register for a free API key at: https://finnhub.io/register

// Base URL for Finnhub API
export const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

// Get API Key from environment variables
// This function tries multiple methods to get the API key
const getApiKey = (): string => {
  try {
    // Method 1: Try to get from expo constants (from app.config.js)
    const apiKeyFromExpo = Constants.expoConfig?.extra?.FINNHUB_API_KEY;
    
    if (apiKeyFromExpo && apiKeyFromExpo !== 'DEMO_KEY') {
      console.log('Using API key from Expo config');
      return apiKeyFromExpo;
    }
    
    // Method 2: Try to get directly from process.env (for development)
    if (process.env.FINNHUB_API_KEY) {
      console.log('Using API key from process.env');
      return process.env.FINNHUB_API_KEY;
    }
    
    // No valid API key found
    console.warn('⚠️ No valid FINNHUB_API_KEY found in environment variables');
    console.warn('Please add your API key to .env file in the frontend directory');
    return 'DEMO_KEY'; // Fallback key for development only
  } catch (error) {
    console.error('Error getting API key:', error);
    return 'DEMO_KEY'; // Fallback key for development only
  }
};

// Export the API key
export const FINNHUB_API_KEY = getApiKey();

// Log first few characters of the API key for debugging
console.log(`API Key configured: ${FINNHUB_API_KEY.substring(0, 3)}...`);

// Cache duration in milliseconds (5 minutes)
export const CACHE_DURATION = 5 * 60 * 1000;

// Rate limit (60 API calls per minute for free tier)
export const RATE_LIMIT = {
  maxCalls: 60,
  perMinutes: 1
}; 