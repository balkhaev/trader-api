import { Tables } from "../../../database.types"
import { Analyze, Candle } from "../../../types"
import { isAboveEMA } from "../../blackbox/indicators/ema"
import { getSupertrendSignal } from "../../blackbox/signals/supertrend"
import { getCrossingSignal } from "../../blackbox/strategies"
import { MetaSignal } from "../types"
import { boolToSignal } from "../utils"

type SignalOpts = {
  analysis: Analyze
  currentPrice: number
  candles3: Candle[]
  candles15: Candle[]
  candles30: Candle[]
  candles240: Candle[]
}

export function buyEovieSignal({
  analysis,
  currentPrice,
  candles3,
  candles15,
  candles30,
  candles240,
}: SignalOpts): MetaSignal {
  const { signal: globalTrend } = getSupertrendSignal(
    currentPrice,
    candles240,
    10,
    2
  )

  if (
    !globalTrend ||
    !analysis.rsi ||
    !analysis.stochasticRsi ||
    !analysis.macd ||
    !analysis.sma ||
    !analysis.cci
  ) {
    return { signal: 0, indicators: [{ name: "Insufficient Data", signal: 0 }] }
  }

  const isBullishTrend = isAboveEMA(candles240, 200).above

  const buyConditions = [
    analysis.rsi > 28,
    analysis.rsi < 50,
    analysis.cci < -100,
    currentPrice < analysis.sma * 0.96,
    analysis.stochasticRsi.stochRSI < 20,
  ]

  const buySignal =
    buyConditions.every(Boolean) && globalTrend && isBullishTrend

  return {
    signal: boolToSignal(buySignal),
    indicators: [
      {
        name: "RSI within range",
        signal: boolToSignal(analysis.rsi > 28 && analysis.rsi < 50),
      },
      {
        name: "Price below SMA",
        signal: boolToSignal(currentPrice < analysis.sma * 0.96),
      },
      {
        name: "Stochastic RSI Oversold",
        signal: boolToSignal(analysis.stochasticRsi.stochRSI < 20),
      },
      { name: "Global Trend Bullish", signal: boolToSignal(globalTrend) },
      {
        name: "CCI Oversold",
        signal: boolToSignal(analysis.cci < -100),
        data: analysis.cci,
      },
      { name: "Above EMA 200", signal: boolToSignal(isBullishTrend) },
    ],
  }
}

export function sellEovieSignal(
  buy: Tables<"buys">,
  currentPrice: number,
  candles1: Candle[],
  candles3: Candle[],
  candles15: Candle[],
  candles30: Candle[]
): MetaSignal {
  const pnl = parseFloat(buy.qty) * (currentPrice - buy.price)
  const takeProfitPnl = 0.05 // Example threshold
  const stopLossPnl = -0.3 // Example threshold

  if (pnl >= takeProfitPnl) {
    return {
      signal: -1,
      indicators: [{ name: "Take Profit Triggered", signal: -1, data: pnl }],
    }
  }

  if (pnl <= stopLossPnl) {
    return {
      signal: -1,
      indicators: [{ name: "Stop Loss Triggered", signal: -1, data: pnl }],
    }
  }

  const { signal: st3 } = getSupertrendSignal(currentPrice, candles3, 10, 2)
  const { signal: st15 } = getSupertrendSignal(currentPrice, candles15, 10, 2)

  const signal = getCrossingSignal([st3, st15])

  return {
    signal,
    indicators: [
      { name: "Supertrend 3m", signal: st3 },
      { name: "Supertrend 15m", signal: st15 },
    ],
  }
}
