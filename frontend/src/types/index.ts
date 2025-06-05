export interface User {
  id: number;
  email: string;
}

export interface Portfolio {
  id: number;
  name: string;
  startingBalance: number;
  holdings: Holding[];
}

export interface Holding {
  id: number;
  symbol: string;
  amount: number;
  boughtAtPrice: number;
}

export interface AuthResponse {
  token: string;
  user: User;
} 