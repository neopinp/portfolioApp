// Import dotenv to load environment variables from .env file
import 'dotenv/config';
import { join } from 'path';
import { config } from 'dotenv';

// Try to load environment variables from frontend/.env
config({ path: join(__dirname, '.env') });

// Try to load environment variables from root .env as fallback
// This will not override existing variables from the frontend .env
config({ path: join(__dirname, '..', '.env') });

// Get API key from environment variables
const apiKey = process.env.FINNHUB_API_KEY || 'DEMO_KEY';
console.log(`Using Finnhub API key: ${apiKey.substring(0, 3)}...`);

export default {
  name: "frontend",
  slug: "frontend",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  newArchEnabled: true,
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  ios: {
    supportsTablet: true
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff"
    },
    edgeToEdgeEnabled: true
  },
  web: {
    favicon: "./assets/favicon.png"
  },
  plugins: [
    "expo-secure-store"
  ],
  extra: {
    // Pass the API key to the app
    FINNHUB_API_KEY: apiKey,
  }
}; 