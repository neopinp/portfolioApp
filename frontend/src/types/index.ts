export interface Portfolio {
  id: number;
  name: string;
  starting_balance: number;
  risk_score: number;
  holdings: Holding[];
  value: number;
  change: number;
  riskScore: number;
  userId?: number;
  created_at?: Date;
  chartData?: any[];
}

export interface Holding {
  id: number;
  portfolio_id: number;
  asset_symbol: string;
  amount: number;
  bought_at_price?: number;
  created_at?: Date;
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
