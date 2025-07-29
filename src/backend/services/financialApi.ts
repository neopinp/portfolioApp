import { FINNHUB_API_KEY, FINNHUB_BASE_URL, TWELVE_DATA_API_KEY, TWELVE_DATA_BASE_URL } from "../config/financialApi";

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

interface HistoricalDataPoint {
  date: string;
  price: number;
}

export class FinancialApiService {

  // Fetch historical data for an asset from startDate to endDate using Twelve Data - triggered from handleSubmit in frontend
  async getAssetHistoricalData(
    symbol: string,
    startDate: Date,
    endDate: Date
  ): Promise<HistoricalDataPoint[]> {
    try {
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      const url = `${TWELVE_DATA_BASE_URL}/time_series?symbol=${encodeURIComponent(symbol)}&interval=1day&start_date=${startDateStr}&end_date=${endDateStr}&apikey=${TWELVE_DATA_API_KEY}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`Failed to fetch historical data for ${symbol}: ${response.status}`);
        return [];
      }

      const data = await response.json();
      
      if (!data || !data.values || !Array.isArray(data.values)) {
        console.error(`Invalid historical data for ${symbol}:`, data);
        return [];
      }

      // Transform the data to match our format
      const historicalData: HistoricalDataPoint[] = data.values.map((item: any) => ({
        date: item.datetime.split(' ')[0], // Extract date part
        price: parseFloat(item.close)
      }));

      return historicalData;
    } catch (error) {
      console.error(`Error fetching historical data for ${symbol}:`, error);
      return [];
    }
  }

  async getQuote(symbol: string): Promise<QuoteData | null> {
    try {
      const url = `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_API_KEY}`;
      const response = await fetch(url);

      if (!response.ok) {
        console.error(
          `Failed to fetch quote for ${symbol}: ${response.status}`
        );
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
      changePercent: parseFloat(changePercent.toFixed(2)),
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
