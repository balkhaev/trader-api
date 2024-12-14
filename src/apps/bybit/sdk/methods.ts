import { GetKlineParamsV5, OrderParamsV5 } from "bybit-api"
import { bybitRestClient } from "./clients"
import { Candle, Ticker } from "../../../types"
import { klineAdapter, tickerAdapter } from "./adapters"

export async function fetchTickers(): Promise<Ticker[]> {
  const { result } = await bybitRestClient.getTickers({
    category: "spot",
    baseCoin: process.env.BASE_CURRENCY,
  })

  return result.list.map(tickerAdapter)
}

export async function fetchKline({
  symbol = "BTCUSDT",
  interval = "15",
  limit = 50,
}: Partial<GetKlineParamsV5>): Promise<Candle[]> {
  const res = await bybitRestClient.getKline({
    symbol,
    category: "spot",
    interval,
    limit, // Количество свечей (ограничено API)
  })

  return res.result.list.map(klineAdapter)
}

export async function fetchCurrentPrice(symbol: string) {
  const { result } = await bybitRestClient.getTickers({
    symbol,
    category: "spot",
  })

  return parseFloat(result.list[0].lastPrice)
}

export type OrderParams = Pick<
  OrderParamsV5,
  "orderType" | "symbol" | "side" | "qty" | "price" | "marketUnit"
>

export async function createOrder(opts: OrderParams) {
  const { result, retMsg } = await bybitRestClient.submitOrder({
    ...opts,
    category: "spot",
    timeInForce: "GTC",
    marketUnit: "quoteCoin",
  })

  if (retMsg.toLowerCase() !== "ok") {
    throw new Error(retMsg)
  }

  return result
}

export async function fetchPositions(symbol?: string) {
  const position = await bybitRestClient.getPositionInfo({
    category: "spot",
    settleCoin: "USDT",
    symbol,
  })

  return position.result.list
}

export async function fetchInstrumentInfo(symbol: string) {
  const { result } = await bybitRestClient.getInstrumentsInfo({
    category: "spot",
    symbol,
  })

  const instrument = result.list[0]

  return instrument
}
