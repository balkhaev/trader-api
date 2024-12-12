import Queue from "bull"
import { getTechnicalAnalyze } from "../blackbox/indicators"
import { supabase } from "../../lib/supabase"
import snakecaseKeys from "snakecase-keys"
import { io } from "../../server"
import { bybitRestClient } from "./sdk/clients"
import { tickerAdapter } from "./sdk/adapters"
import { fetchKline } from "./sdk/methods"
import { analyzeCandles } from "../blackbox"
import { KlineIntervalV3 } from "bybit-api"
import { buy } from "./buysell"
import { buySignal } from "./signals"

export const analyzeSymbolQueue = new Queue<{ symbol: string }>("bybit-analyze")

export const CANDLES_TO_FETCH: KlineIntervalV3[] = [
  "3",
  "15",
  "30",
  "60",
  "240",
]

analyzeSymbolQueue.process(3, async (job) => {
  const [candles3, candles15, candles30, candles60, candles240] =
    await Promise.all(
      CANDLES_TO_FETCH.map((interval) =>
        fetchKline({ symbol: job.data.symbol, interval })
      )
    )

  const { result: tickers } = await bybitRestClient.getTickers({
    category: "linear",
    symbol: job.data.symbol,
  })

  const ticker = tickerAdapter(tickers.list[0])
  const analysis = getTechnicalAnalyze(candles15)
  const rating = analyzeCandles({
    analysis,
    ticker,
  })
  const strategy = buySignal(
    ticker.lastPrice,
    candles3,
    candles15,
    candles30,
    candles60,
    candles240
  )

  return {
    ...analysis,
    ...strategy,
    rating,
    volume24h: parseInt(tickers.list[0].volume24h),
    openInterest: parseInt(tickers.list[0].openInterest),
    change24h: parseFloat(tickers.list[0].price24hPcnt),
    symbol: job.data.symbol,
  }
})

analyzeSymbolQueue.on("completed", async (job) => {
  if (job.returnvalue.signal === 1) {
    buy(job.returnvalue.symbol)
  }

  const { error } = await supabase
    .from("analysis")
    .insert(snakecaseKeys(job.returnvalue, { deep: false }))

  if (error) {
    console.error(job, error)
    throw error
  }

  io.emit("job-count", await analyzeSymbolQueue.count())
})

analyzeSymbolQueue.on("waiting", async () => {
  io.emit("job-count", await analyzeSymbolQueue.count())
})
