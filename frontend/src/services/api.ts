import { API_URL, getApiUrl } from '../config/api';
import { storage } from '../utils/storage';

// Generic API request function
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  try {
    // Get the auth token
    const token = await storage.getItem<string>('AUTH_TOKEN');
    
    // Prepare headers
    const headers = new Headers({
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    });

    // Add auth token if available
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(getApiUrl(endpoint), {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// API methods
export const api = {
  // Test endpoint
  test: {
    database: () => apiRequest('test/test-db'),
  },

  // Auth endpoints
  auth: {
    login: (email: string, password: string) => 
      apiRequest('auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    register: (email: string, password: string, username: string) =>
      apiRequest('auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, username }),
      }),
  },
  
  // Portfolio endpoints
  portfolios: {
    getAll: () => apiRequest('portfolios'),
    getOne: (id: number) => apiRequest(`portfolios/${id}`),
    create: (data: any) =>
      apiRequest('portfolios', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  
  // Holdings endpoints
  holdings: {
    getAll: (portfolioId: number) => 
      apiRequest(`holdings?portfolioId=${portfolioId}`),
    add: (portfolioId: number, data: any) =>
      apiRequest('holdings', {
        method: 'POST',
        body: JSON.stringify({ portfolioId, ...data }),
      }),
  },
};