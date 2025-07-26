import { FINNHUB_API_KEY } from '../config/financialApi';

interface QuoteData {
  c: number; // Current price
  pc: number; // Previous close
  v: number; // Volume
}

interface AssetDetails {
  symbol: string;
  currentPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;
}

export class FinancialApiService {
  private readonly baseUrl = 'https://finnhub.io/api/v1';
  private readonly apiKey = FINNHUB_API_KEY;

  async getQuote(symbol: string): Promise<QuoteData | null> {
    try {
      const url = `${this.baseUrl}/quote?symbol=${encodeURIComponent(symbol)}&token=${this.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`Failed to fetch quote for ${symbol}: ${response.status}`);
        return null;
      }

      const data = await response.json();
      
      if (!data || data.c === undefined) {
        console.error(`Invalid quote data for ${symbol}:`, data);
        return null;
      }

      return data;
    } catch (error) {
      console.error(`Error fetching quote for ${symbol}:`, error);
      return null;
    }
  }

  async getAssetDetails(symbol: string): Promise<AssetDetails | null> {
    const quoteData = await this.getQuote(symbol);
    
    if (!quoteData) {
      return null;
    }

    const currentPrice = quoteData.c;
    const previousClose = quoteData.pc;
    const change = currentPrice - previousClose;
    const changePercent = previousClose ? (change / previousClose) * 100 : 0;

    return {
      symbol,
      currentPrice,
      previousClose,
      change,
      changePercent: parseFloat(changePercent.toFixed(2))
    };
  }

  async getMultipleQuotes(symbols: string[]): Promise<Map<string, number>> {
    const priceMap = new Map<string, number>();
    
    // Fetch quotes in parallel for better performance
    const quotePromises = symbols.map(async (symbol) => {
      const details = await this.getAssetDetails(symbol);
      return { symbol, details };
    });

    const results = await Promise.all(quotePromises);
    
    for (const { symbol, details } of results) {
      if (details) {
        priceMap.set(symbol, details.currentPrice);
      }
    }

    return priceMap;
  }
} 