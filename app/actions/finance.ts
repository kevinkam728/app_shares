'use server'

import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

export async function getStockData(ticker: string) {
  try {
    const quote = await yahooFinance.quote(ticker);
    return quote;
  } catch (error) {
    console.error("Error fetching stock:", error);
    return null;
  }
}

export async function getHistoricalData(ticker: string) {
  try {
    const queryOptions = { period1: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }; // 30 días
    const result = await yahooFinance.historical(ticker, queryOptions);
    return result;
  } catch (error) {
    console.error("Error fetching historical data:", error);
    return null;
  }
}

export async function searchStocks(query: string) {
  try {
    const result = await yahooFinance.search(query);
    return result.quotes.slice(0, 6).map((q: any) => ({
      symbol: q.symbol,
      name: q.shortname || q.longname
    }));
  } catch (error) {
    console.error("Error searching stocks:", error);
    return [];
  }
}
