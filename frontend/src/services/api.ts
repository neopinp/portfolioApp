import { Portfolio } from "types";
import { API_URL, getApiUrl } from "../config/api";
import { storage, STORAGE_KEYS } from "../utils/storage";

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

interface CreatePortfolioData {
  name: string;
  starting_balance: number;
  risk_score: number;
}

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
    getAll: (portfolioId: number) =>
      apiRequest(`holdings?portfolioId=${portfolioId}`),
    add: (portfolioId: number, data: any) =>
      apiRequest(`holdings/${portfolioId}`, {
        method: "POST",
        body: JSON.stringify({
          symbol: data.symbol,
          amount: data.amount || 100,
          boughtAtPrice: data.boughtAtPrice || 0,
        }),
      }),
  },
};

// Fetch a portfolio with full details
export const fetchPortfolio = async (id: number): Promise<Portfolio> => {
  try {
    const response = await api.portfolios.getOne(id);
    
    // Transform the API response to match our Portfolio type
    const portfolio: Portfolio = {
      id: response.portfolio.id,
      name: response.portfolio.name,
      starting_balance: response.portfolio.starting_balance,
      risk_score: response.portfolio.risk_score,
      holdings: response.portfolio.holdings || [],
      value: response.portfolio.value || 0,
      change: response.portfolio.change || 0,
      riskScore: response.portfolio.risk_score || 5,
      userId: response.portfolio.user_id,
      created_at: response.portfolio.created_at ? new Date(response.portfolio.created_at) : undefined,
    };
    
    return portfolio;
  } catch (error) {
    console.error("Error fetching portfolio:", error);
    throw error;
  }
};
