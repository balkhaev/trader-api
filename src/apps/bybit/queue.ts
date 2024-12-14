import Queue from "bull"
import { getTechnicalAnalyze } from "../blackbox/indicators"
import { supabase } from "../../lib/supabase"
import snakecaseKeys from "snakecase-keys"
import { io } from "../../server"
import { bybitRestClient } from "./sdk/clients"
import { tickerAdapter } from "./sdk/adapters"
import { fetchKline } from "./sdk/methods"
import { ratingAnalyze } from "../blackbox"
import { KlineIntervalV3 } from "bybit-api"
import { buy } from "./buysell"
import { buySignal } from "./signals"

export const analyzeSymbolQueue = new Queue<{ symbol: string }>("bybit-analyze")

export const CANDLES_TO_FETCH: KlineIntervalV3[] = [
  "3",
  "15",
  "30",
  // "60",
  // "240",
]

analyzeSymbolQueue.process(10, async (job) => {
  const [candles3, candles15, candles30] = await Promise.all(
    CANDLES_TO_FETCH.map((interval) =>
      fetchKline({ symbol: job.data.symbol, interval })
    )
  )

  const { result: tickers } = await bybitRestClient.getTickers({
    category: "spot",
    symbol: job.data.symbol,
  })

  const ticker = tickerAdapter(tickers.list[0])
  // const analysis3 = getTechnicalAnalyze(candles3)
  // const analysis15 = getTechnicalAnalyze(candles15)
  const analysis30 = getTechnicalAnalyze(candles30)

  const rating = ratingAnalyze({
    analysis: analysis30,
    ticker,
  })

  const strategy = buySignal({
    analysis: analysis30,
    currentPrice: ticker.lastPrice,
    candles3,
    candles15,
    candles30,
  })

  return {
    ...analysis30,
    ...strategy,
    rating,
    volume24h: parseInt(tickers.list[0].volume24h),
    change24h: parseFloat(tickers.list[0].price24hPcnt),
    symbol: job.data.symbol,
  }
})

analyzeSymbolQueue.on("waiting", async () => {
  io.emit("job-count", await analyzeSymbolQueue.count())
})
