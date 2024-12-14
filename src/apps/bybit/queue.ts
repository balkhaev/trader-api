import Queue from "bull"
import { getTechnicalAnalyze } from "../blackbox/indicators"
import { io } from "../../server"
import { bybitRestClient } from "./sdk/clients"
import { tickerAdapter } from "./sdk/adapters"
import { fetchKline } from "./sdk/methods"
import { ratingAnalyze } from "../blackbox"
import { KlineIntervalV3 } from "bybit-api"
import { buyLongSignal } from "./strategy/long"
import { buyShortSignal } from "./strategy/short"
import { buyEovieSignal } from "./strategy/e0v1e"

export const analyzeSymbolQueue = new Queue<{ symbol: string }>(
  "bybit-analyze",
  {
    redis: {
      port: 6379,
      host: process.env.REDIS_HOST,
      password: process.env.REDIS_PASSWORD,
    },
  }
)

export const CANDLES_TO_FETCH: KlineIntervalV3[] = [
  "1",
  "3",
  "5",
  "15",
  "30",
  "240",
]

analyzeSymbolQueue.process(4, async (job) => {
  const [candles1, candles3, candles5, candles15, candles30, candles240] =
    await Promise.all(
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

  const long = buyLongSignal({
    analysis: analysis30,
    currentPrice: ticker.lastPrice,
    candles1,
    candles3,
    candles5,
    candles15,
    candles30,
    candles240,
  })

  const short = buyShortSignal({
    analysis: analysis30,
    currentPrice: ticker.lastPrice,
    candles1,
    candles3,
    candles5,
    candles15,
    candles30,
    candles240,
  })

  const e0v1e = buyEovieSignal({
    analysis: analysis30,
    currentPrice: ticker.lastPrice,
    candles1,
    candles3,
    candles5,
    candles15,
    candles30,
    candles240,
  })

  return {
    ...analysis30,
    e0v1e,
    long,
    short,
    rating,
    volume24h: parseInt(tickers.list[0].volume24h),
    change24h: parseFloat(tickers.list[0].price24hPcnt),
    symbol: job.data.symbol,
  }
})

analyzeSymbolQueue.on("waiting", async () => {
  io.emit("job-count", await analyzeSymbolQueue.count())
})
