import { OHLCVKlineV5, TickerSpotV5 } from "bybit-api"
import { Candle, Ticker } from "../../../types"

export const tickerAdapter = (ticker: TickerSpotV5): Ticker => ({
  symbol: ticker.symbol,
  lastPrice: parseFloat(ticker.lastPrice),
  volume24h: parseFloat(ticker.volume24h),
  change24h: parseFloat(ticker.price24hPcnt),
})

export const klineAdapter = (kline: OHLCVKlineV5): Candle => ({
  start: parseInt(kline[0]),
  time: parseInt(kline[0]),
  open: parseFloat(kline[1]),
  high: parseFloat(kline[2]),
  low: parseFloat(kline[3]),
  close: parseFloat(kline[4]),
  volume: parseFloat(kline[5]),
})
