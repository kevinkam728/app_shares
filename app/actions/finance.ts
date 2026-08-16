'use server'

import yahooFinance from 'yahoo-finance2';

// Yahoo Finance v2 requiere inicialización
const yf = yahooFinance;

export async function getStockData(ticker: string) {
  try {
    const quote = await yf.quote(ticker);
    return quote;
  } catch (error) {
    console.error("Error fetching stock:", error);
    return null;
  }
}

export async function getHistoricalData(ticker: string) {
  try {
    const queryOptions = { period1: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }; // 30 días
    const result = await yf.historical(ticker, queryOptions);
    return result;
  } catch (error) {
    console.error("Error fetching historical data:", error);
    return null;
  }
}
