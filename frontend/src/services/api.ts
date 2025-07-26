import { Portfolio } from "types";
import { getApiUrl } from "../config/api";
import { storage } from "../utils/storage";
import { CreatePortfolioData, AddHoldingDto } from "types";

// Generic API request function
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  try {
    // Get the auth token
    const token = await storage.getItem<string>("auth_token");

    // Prepare headers
    const headers = new Headers({
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    });

    // Add auth token if available
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(getApiUrl(endpoint), {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
};

// API methods
export const api = {
  // Test endpoint
  test: {
    database: () => apiRequest("test/test-db"),
  },

  // Auth endpoints
  auth: {
    login: async (email: string, password: string) => {
      const response = await apiRequest("auth/login", {
        method: "POST",
        body: JSON.stringify({ emailorUsername: email, password }),
      });
      return {
        token: response.token,
        user: {
          ...response.user,
          onboardingComplete: response.user.onboardingComplete ?? false,
        },
      };
    },
    register: async (email: string, password: string, username: string) => {
      const response = await apiRequest("auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, username }),
      });
      return {
        user: {
          ...response.user,
          onboardingComplete: false, // New users always start with onboarding incomplete
        },
      };
    },
    checkEmail: async (email: string) => {
      const response = await apiRequest("auth/check-email", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      return {
        exists: response.exists,
      };
    },
  },

  // Portfolio endpoints
  portfolios: {
    getAll: () => apiRequest("portfolios"),
    getOne: (id: number) => apiRequest(`portfolios/${id}`),
    create: (data: CreatePortfolioData) =>
      apiRequest("portfolios", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  // User preferences endpoints
  preferences: {
    get: () => apiRequest("preferences"),
    getOnboarding: () => apiRequest("preferences/onboarding"),
  },

  // Holdings endpoints
  holdings: {
    add: (portfolioId: number, data: AddHoldingDto) =>
      apiRequest(`holdings/${portfolioId}`, {
        method: "POST",
        body: JSON.stringify({
          symbol: data.symbol,
          amount: data.amount || 100,
          boughtAtPrice: data.boughtAtPrice || 0,
          boughtAtDate: data.boughtAtDate,
        }),
      }),
    getAggregatedHoldings: (portfolioId: number) =>
      apiRequest(`holdings/${portfolioId}/aggregated`),
    getHoldingsBySymbol: (portfolioId: number, symbol: string) =>
      apiRequest(`holdings/${portfolioId}/symbol/${symbol}`),
    getPerformance: (portfolioId: number) =>
      apiRequest(`holdings/${portfolioId}/performance`),
    getAnalytics: (portfolioId: number) =>
      apiRequest(`holdings/${portfolioId}/analytics`),
    getHistory: (portfolioId: number) => apiRequest(`holdings/${portfolioId}`),
    createSnapshot: (portfolioId: number) =>
      apiRequest(`holdings/${portfolioId}/snapshot`, {
        method: "POST",
      }),
    checkSnapshotNeeded: (portfolioId: number) =>
      apiRequest(`holdings/${portfolioId}/snapshot/check`),
    getLastSnapshotDate: (portfolioId: number) =>
      apiRequest(`holdings/${portfolioId}/snapshot/last`),
  },
};

// Fetch a portfolio with full details - fix
export const fetchPortfolio = async (id: number): Promise<Portfolio> => {
  try {
    const response = await api.portfolios.getOne(id);

    // Transform the API response to match our Portfolio type
    const portfolio: Portfolio = {
      id: response.portfolio.id,
      name: response.portfolio.name,
      startingBalance: response.portfolio.startingBalance,
      holdings: response.portfolio.holdings || [],
      value: response.portfolio.value || 0,
      change: response.portfolio.change || 0,
      riskScore: response.portfolio.riskScore || 5,
      userId: response.portfolio.userId,
      createdAt: response.portfolio.createdAt
        ? new Date(response.portfolio.createdAt)
        : undefined,
    };

    return portfolio;
  } catch (error) {
    console.error("Error fetching portfolio:", error);
    throw error;
  }
};
