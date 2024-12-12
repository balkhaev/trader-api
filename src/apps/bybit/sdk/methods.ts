import { GetKlineParamsV5, OrderParamsV5 } from "bybit-api"
import { bybitRestClient } from "./clients"
import { Candle, Ticker } from "../../../types"
import { klineAdapter, tickerAdapter } from "./adapters"

export async function fetchTickers(): Promise<Ticker[]> {
  const { result } = await bybitRestClient.getTickers({
    category: "linear",
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
    category: "linear",
    interval,
    limit, // Количество свечей (ограничено API)
  })

  return res.result.list.map(klineAdapter)
}

export async function fetchCurrentPrice(symbol: string) {
  const { result } = await bybitRestClient.getTickers({
    symbol,
    category: "linear",
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
    category: "linear",
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
    category: "linear",
    settleCoin: "USDT",
    symbol,
  })

  return position.result.list
}
