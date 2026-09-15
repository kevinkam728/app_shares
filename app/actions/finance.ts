'use server'

import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

export async function getStockData(ticker: string): Promise<any> {
  if (!ticker) return null;
  try {
    const [quote, summary] = await Promise.all([
      yahooFinance.quote(ticker),
      yahooFinance.quoteSummary(ticker, { modules: ['summaryDetail', 'defaultKeyStatistics'] }).catch(() => null)
    ]);

    const summaryDetail = (summary as any)?.summaryDetail || {};
    const defaultKeyStatistics = (summary as any)?.defaultKeyStatistics || {};

    return {
      ...(quote as any),
      marketCap: (quote as any).marketCap || summaryDetail.marketCap,
      peRatio: (quote as any).trailingPE || summaryDetail.trailingPE || defaultKeyStatistics.forwardPE || defaultKeyStatistics.trailingPE,
      ebitda: defaultKeyStatistics.ebitda || summaryDetail.ebitda,
      eps: (quote as any).epsTrailingTwelveMonths || defaultKeyStatistics.trailingEps,
      yearHigh: (quote as any).fiftyTwoWeekHigh || summaryDetail.fiftyTwoWeekHigh,
      yearLow: (quote as any).fiftyTwoWeekLow || summaryDetail.fiftyTwoWeekLow,
    };
  } catch (error) {
    console.error("Error fetching stock:", error);
    return null;
  }
}

export async function getHistoricalData(ticker: string) {
  if (!ticker) return null;
  try {
    const queryOptions = { period1: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }; // 30 días
    const result = await yahooFinance.chart(ticker, queryOptions);
    return result.quotes;
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
