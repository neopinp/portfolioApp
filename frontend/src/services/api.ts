import axios from 'axios';
import { AuthResponse, Portfolio, Holding } from '../types';

const API_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    return response.data;
  },
  register: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', { email, password });
    return response.data;
  },
};

export const portfolioService = {
  getPortfolios: async (): Promise<Portfolio[]> => {
    const response = await api.get<Portfolio[]>('/portfolios');
    return response.data;
  },
  createPortfolio: async (name: string, startingBalance: number): Promise<Portfolio> => {
    const response = await api.post<Portfolio>('/portfolios', { name, startingBalance });
    return response.data;
  },
  addHolding: async (portfolioId: number, holding: Omit<Holding, 'id'>): Promise<Holding> => {
    const response = await api.post<Holding>(`/holdings/${portfolioId}`, holding);
    return response.data;
  },
};

export default api; 