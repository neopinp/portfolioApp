// API Configuration
const API_CONFIG = {
  // Development URLs
  development: {
    baseURL: "http://localhost:5000/api",
    ngrokURL: "https://a3cae3bfee07.ngrok-free.app/api", // Added /api suffix
  },
  // Production URL (when you deploy)
  production: {
    baseURL: "https://your-production-url.com/api",
  },
};

// Get the current environment - use __DEV__ for React Native
const ENV = __DEV__ ? "development" : "production";

// Export the appropriate configuration
export const API_URL =
  ENV === "production"
    ? API_CONFIG.production.baseURL
    : API_CONFIG.development.ngrokURL;

// Helper function to get full API URL
export const getApiUrl = (endpoint: string) => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
  return `${API_URL}/${cleanEndpoint}`;
};
