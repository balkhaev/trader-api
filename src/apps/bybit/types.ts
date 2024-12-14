import { Tables } from "../../database.types"
import { Analyze, Candle, Signal } from "../../types"

export type BybitWS = {
  topic: string
  data: any
  type: string
}

export type AllowedIntervals = "1" | "3" | "15" | "30"

export interface Trade {
  time: number // Unix timestamp в секундах
  price: number
  volume: number
}

export type MetaSignal = {
  signal: Signal
  indicators: {
    name: string
    signal?: Signal
    data?: any
  }[]
  newTrend?: boolean
}

export type SignalOpts = {
  analysis?: Analyze
  currentPrice: number
  candles1: Candle[]
  candles3: Candle[]
  candles5: Candle[]
  candles15: Candle[]
  candles30: Candle[]
  candles240: Candle[]
}

export type SignalSellOpts = SignalOpts & {
  buy: Tables<"buys">
}
