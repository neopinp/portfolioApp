export interface Portfolio {
  id: number;
  name: string;
  startingBalance: number;
  holdings: Holding[];
  value: number;
  change: number;
  riskScore: number;
  userId?: number;
  createdAt?: Date;
  chartData?: any[];
}

export interface CreatePortfolioData {
  name: string;
  startingBalance: number;
  riskScore: number;
}

export interface Holding {
  id: number;
  portfolioId: number;
  assetSymbol: string;
  amount: number;
  boughtAtPrice?: number;
  createdAt?: Date;
  symbol?: string;
  fullName?: string;
  value?: number;
  change?: number;
  imageUrl?: string;

  // Additional properties for real-time data
  quantity: number;
  purchasePrice: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercentage: number;
  asset: Asset;
}

export interface Asset {
  symbol: string;
  name: string;
  price: number;
  change: number;
  fullName?: string;
  riskScore: number;
  type?: string;
  sector?: string;
  imageUrl?: string;

  // Additional detailed information
  marketCap?: string;
  sharesOutstanding?: string;
  high52w?: string;
  low52w?: string;
  peRatio?: string;
  eps?: string;
  beta?: string;
  dividendYield?: string;
  volume?: string;
  avgVolume?: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  onboardingComplete: boolean;
  created_at?: Date;
}

export interface OnboardingData {
  riskTolerance: number;
  investmentGoals: string;
  initialInvestment: number;
}

// Charting Specific Types

export interface TimeSeriesPoint {
  timestamp: number;
  price: number;
}

export interface ChartData {
  data: TimeSeriesPoint[];
  startDate: string;
  endDate: string;
}
// Simple in-memory cache
export interface CacheItem {
  data: any;
  timestamp: number;
}
