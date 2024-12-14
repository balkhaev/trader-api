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
    limit,
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
  })

  if (retMsg.toLowerCase() !== "ok") {
    throw new Error(retMsg)
  }

  return result
}

export async function fetchPositions(symbol?: string) {
  const position = await bybitRestClient.getPositionInfo({
    category: "spot",
    settleCoin: process.env.BASE_CURRENCY,
    symbol,
  })

  return position.result.list ?? []
}

export async function fetchInstrumentInfo(symbol: string) {
  const { result } = await bybitRestClient.getInstrumentsInfo({
    category: "spot",
    symbol,
  })

  const instrument = result.list[0]

  return instrument
}

export async function fetchBuyedCoins() {
  const { result } = await bybitRestClient.getWalletBalance({
    accountType: "UNIFIED",
  })

  if (!result.list) {
    return []
  }

  return result.list[0].coin.filter(
    (el) =>
      el.coin.toUpperCase() !== process.env.BASE_CURRENCY &&
      parseInt(el.usdValue) > 0.5
  )
}

export async function fetchTradeHistory(symbol: string) {
  const { result } = await bybitRestClient.getExecutionList({
    category: "spot",
    symbol,
  })

  if (!result.list) {
    return []
  }

  return result.list
}
