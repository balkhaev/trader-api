import { ExecutionV5 } from "bybit-api"
import { Analyze, Candle } from "../../../types"
import { getSupertrendSignal } from "../../blackbox/signals/supertrend"
import { getCrossingSignal } from "../../blackbox/strategies"
import { BUY_SIGNAL_CANDLES_LIMIT } from "../consts"
import { MetaSignal } from "../types"
import { isAboveEMA } from "../../blackbox/indicators/ema"
import { isVolumeIncreasing } from "../../blackbox/indicators/volume"
import { ATR } from "technicalindicators"

function calculateATR(candles: Candle[]): number {
  return (
    ATR.calculate({
      low: candles.map((c) => c.low),
      high: candles.map((c) => c.high),
      close: candles.map((c) => c.close),
      period: 14,
    }).pop() || 0
  )
}

type SignalOpts = {
  analysis: Analyze
  currentPrice: number
  candles1: Candle[]
  candles3: Candle[]
  candles15: Candle[]
  candles30: Candle[]
  candles240: Candle[]
}

const isBullishTrend = (candles: Candle[], period: number) => {
  return candles[candles.length - 1].close > isAboveEMA(candles, period).diff
}

export function buyShortSignal({
  analysis,
  currentPrice,
  candles1,
  candles30,
  candles240,
}: SignalOpts): MetaSignal {
  if (
    !analysis.adx?.adx ||
    !analysis.stochasticRsi?.stochRSI ||
    !analysis.rsi
  ) {
    return {
      signal: 0,
      indicators: [{ name: "Insufficient Data", signal: 0 }],
    }
  }

  const volumeInc = isVolumeIncreasing(candles30)
  const globalBullish = isBullishTrend(candles240, 200) // 4H EMA 200
  const mediumBullish = isBullishTrend(candles30, 50) // 30m EMA 50

  // Определение спада цены (Pullback)
  const shortEMA = isAboveEMA(candles1, 20) // EMA 20 для 1-минутного графика
  const atr = calculateATR(candles30) // ATR для 30-минутного графика
  const isPullback = shortEMA.diff < 0 && shortEMA.diff > -1 * atr // Цена ниже EMA, но в пределах 1 ATR

  if (!globalBullish || !mediumBullish || !isPullback || !volumeInc) {
    return {
      signal: 0,
      indicators: [
        { name: "Global Bullish", signal: globalBullish ? 1 : 0 },
        { name: "Medium Bullish", signal: mediumBullish ? 1 : 0 },
        { name: "Pullback Confirmed", signal: isPullback ? 1 : 0 },
        { name: "Volume Increasing", signal: volumeInc ? 1 : 0 },
      ],
    }
  }

  const { signal: st240min } = getSupertrendSignal(
    currentPrice,
    candles240,
    BUY_SIGNAL_CANDLES_LIMIT,
    4
  )
  const { signal: st30min } = getSupertrendSignal(
    currentPrice,
    candles30,
    BUY_SIGNAL_CANDLES_LIMIT,
    4
  )
  const { signal: st1min } = getSupertrendSignal(
    currentPrice,
    candles1,
    BUY_SIGNAL_CANDLES_LIMIT,
    1
  )

  return {
    signal: getCrossingSignal([st1min, st30min, st240min]),
    indicators: [
      {
        name: "Supertrend 1 min",
        signal: st1min,
      },
      {
        name: "Supertrend 30 min",
        signal: st30min,
      },
      {
        name: "Supertrend 240 min",
        signal: st240min,
      },
    ],
  }
}

export function sellShortSignal(
  trade: ExecutionV5,
  currentPrice: number,
  candles1: Candle[],
  candles3: Candle[]
): MetaSignal {
  const qty = parseFloat(trade.orderQty)
  const tradePrice = parseFloat(trade.orderPrice)
  const pnl = qty * (currentPrice - tradePrice)
  const takeProfitPnl = 0.2
  const stopLossPnl = -0.5
  const takeProfit = pnl > takeProfitPnl
  const stopLoss = pnl < stopLossPnl

  if (takeProfit || stopLoss) {
    return {
      signal: -1,
      indicators: [
        { name: `Take Profit or Stop Loss Triggered`, signal: -1, data: pnl },
      ],
    }
  }

  const { signal: st1 } = getSupertrendSignal(currentPrice, candles1, 10, 2)
  const { signal: st3 } = getSupertrendSignal(currentPrice, candles3, 10, 2)

  const signal = getCrossingSignal([st1, st3])

  return {
    signal,
    indicators: [
      { name: "Supertrend 1m", signal: st1 },
      { name: "Supertrend 3m", signal: st3 },
    ],
  }
}
