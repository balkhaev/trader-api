import { getSupertrendSignal } from "../../blackbox/signals/supertrend"
import { getCrossingSignal } from "../../blackbox/utils"
import { MACD } from "technicalindicators"
import { MetaSignal, SignalOpts, SignalSellOpts } from "../types"
import {
  isBullishDivergence,
  isBullishEngulfing,
} from "../../blackbox/patterns"
import { isAboveEMA } from "../../blackbox/indicators/ema"
import { isVolumeIncreasing } from "../../blackbox/indicators/volume"
import { boolToSignal } from "../utils"

const BUY_SIGNAL_CANDLES_LIMIT = 10

export function buyLongSignal({
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
    BUY_SIGNAL_CANDLES_LIMIT,
    2
  )

  if (
    !globalTrend ||
    !analysis?.macd?.histogram ||
    !analysis.stochasticRsi ||
    !analysis.adx?.adx ||
    !analysis.macd.histogram ||
    !analysis.rsi
  ) {
    return { signal: 0, indicators: [{ name: "Insufficient Data", signal: 0 }] }
  }

  const isBullishTrend = isAboveEMA(candles240, 200)

  if (!isBullishTrend) {
    return {
      signal: 0,
      indicators: [{ name: "Global EMA trend bearish", signal: 0 }],
    }
  }

  if (!isVolumeIncreasing(candles15)) {
    return {
      signal: 0,
      indicators: [{ name: "Volume not increasing", signal: 0 }],
    }
  }
  // Проверка краткосрочного тренда на 3-минутных свечах
  const { signal: shortTrend } = getSupertrendSignal(
    currentPrice,
    candles3,
    BUY_SIGNAL_CANDLES_LIMIT,
    1
  )

  if (!shortTrend) {
    return {
      signal: 0,
      indicators: [{ name: "Short-term trend bearish (3m)", signal: 0 }],
    }
  }

  const macd = MACD.calculate({
    values: candles30.map((candle) => candle.close),
    fastPeriod: 8,
    slowPeriod: 21,
    signalPeriod: 5,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  })

  const bullishDivergence = isBullishDivergence(
    candles30,
    macd.map((m) => m.histogram!)
  )

  const volumeIncreasing = isVolumeIncreasing(candles30)
  const adxPower = analysis.adx.adx > 25
  const aboveEMA = isAboveEMA(candles240, 200).above
  const notWeakRSI = analysis.rsi > 30
  const stochiRSI = analysis.stochasticRsi.stochRSI < 20
  const bullishEngulfing = isBullishEngulfing(candles15)

  return {
    signal: boolToSignal(
      bullishDivergence &&
        volumeIncreasing &&
        adxPower &&
        aboveEMA &&
        notWeakRSI &&
        stochiRSI &&
        bullishEngulfing
    ),
    indicators: [
      {
        name: "Bullish Divergence Detected",
        signal: boolToSignal(bullishDivergence),
      },
      { name: "Volume Increasing", signal: boolToSignal(volumeIncreasing) },
      {
        name: "ADX Confirms Trend",
        signal: boolToSignal(adxPower),
        data: analysis.adx.adx,
      },
      { name: "EMA Trend Confirms", signal: boolToSignal(aboveEMA) },
      {
        name: "RSI Oversold",
        signal: boolToSignal(notWeakRSI),
        data: analysis.rsi,
      },
      {
        name: "Stochastic RSI Oversold",
        signal: boolToSignal(stochiRSI),
        data: analysis.stochasticRsi.stochRSI,
      },
      {
        name: "Bullish Engulfing Pattern",
        signal: boolToSignal(bullishEngulfing),
      },
    ],
  }
}

export function sellLongSignal({
  buy,
  currentPrice,
  candles3,
  candles15,
}: SignalSellOpts): MetaSignal {
  if (!buy) {
    return { signal: 0, indicators: [{ name: "No buy signal", signal: 0 }] }
  }

  const pnl = parseFloat(buy.qty) * (currentPrice - buy.price)
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
