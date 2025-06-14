export interface Portfolio {
  id: number;
  name: string;
  starting_balance: number;
  risk_score: number;
  holdings: Holding[];
  value?: number;
  change?: number;
}

export interface Holding {
  id: number;
  portfolio_id: number;
  asset_symbol: string;
  amount: number;
  bought_at_price?: number;
  created_at?: Date;
} 