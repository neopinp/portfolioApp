// Backend Financial API Configuration
export const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || 'DEMO_KEY';

// API Configuration
export const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";

// Rate limiting for backend API calls
export const FINNHUB_RATE_LIMIT = {
  maxCalls: 30,
  perMinute: 1
};

// Cache duration in milliseconds (5 minutes)
export const CACHE_DURATION = 5 * 60 * 1000; 