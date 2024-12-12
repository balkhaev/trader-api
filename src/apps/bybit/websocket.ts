import { bybitWsClient } from "./sdk/clients"
import { io } from "../../server"
import { WS_KEY_MAP, isWsOrderbookEventV5 } from "bybit-api"
import { addTrades, setTimeframeKlines, getTimeframeKlines } from "./state"
import { Candle } from "../../types"
import { getTechnicalAnalyze } from "../blackbox/indicators"
import { fetchKline } from "./sdk/methods"
import { AllowedIntervals, BybitWS } from "./types"

function getSubscriptions(symbol: string, exclude = false) {
  const topics = [
    "tickers." + symbol,
    "kline.1." + symbol,
    "kline.3." + symbol,
    "kline.15." + symbol,
    "kline.30." + symbol,
  ]

  return topics.filter((el) => {
    const result = bybitWsClient
      .getWsStore()
      .getTopics(WS_KEY_MAP.v5LinearPublic)
      .has(el)
    return !exclude ? !result : result
  })
}

bybitWsClient.on("update", (data: BybitWS) => {
  if (data.topic?.startsWith("tickers")) {
    io.emit("ticker", JSON.stringify(data.data))
  }

  if (isWsOrderbookEventV5(data)) {
    io.emit("orderbook", JSON.stringify(data.data))
  }

  if (data.topic?.startsWith("kline")) {
    const timeframe = data.topic.split(".")[1] as AllowedIntervals
    const symbolKlines = getTimeframeKlines(timeframe)

    data.data
      .map((kline: any) => ({
        time: parseInt(kline.timestamp),
        start: parseInt(kline.start) / 1000,
        open: parseFloat(kline.open),
        close: parseFloat(kline.close),
        high: parseFloat(kline.high),
        low: parseFloat(kline.low),
        volume: parseFloat(kline.volume),
        turnover: parseFloat(kline.turnover),
      }))
      .forEach((kline: Candle) => setTimeframeKlines(timeframe, kline))

    io.emit("ta" + timeframe, JSON.stringify(getTechnicalAnalyze(symbolKlines)))
  }

  if (data.topic.includes("publicTrade.") && data.data) {
    const symbol = data.topic.split(".")[1]

    const trades = data.data.map((trade: any) => ({
      time: Math.floor(trade.T / 1000),
      price: parseFloat(trade.p),
      volume: parseFloat(trade.v),
    }))

    addTrades(symbol, trades)
  }
})

let intervalId2: NodeJS.Timeout | null = null
export async function listenBybit(symbol: string) {
  // Предварительно загрузить минутные свечи
  const preloadCandles: AllowedIntervals[] = ["1", "3", "15"]

  preloadCandles.forEach((interval) => {
    fetchKline({ symbol, interval, limit: 20 }).then((candles) => {
      candles.forEach((c) => setTimeframeKlines(interval, c))
    })
  })

  bybitWsClient.subscribeV5(getSubscriptions(symbol), "linear")

  intervalId2 = setInterval(() => {
    io.emit(
      "candles",
      getTimeframeKlines("1").slice(-40),
      getTimeframeKlines("3").slice(-40)
    )
  }, 2000)
}

export function unlistenBybit(symbol: string) {
  bybitWsClient.unsubscribeV5(getSubscriptions(symbol, true), "linear")
  if (intervalId2) {
    clearInterval(intervalId2)
    intervalId2 = null
  }
}
