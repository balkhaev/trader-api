import { ExecutionV5 } from "bybit-api"
import { Analyze, Candle, Signal } from "../../../types"
import { getSupertrendSignal } from "../../blackbox/signals/supertrend"
import { getCrossingSignal } from "../../blackbox/strategies"
import { BUY_SIGNAL_CANDLES_LIMIT } from "../consts"
import { MACD } from "technicalindicators"
import { MetaSignal } from "../types"
import { addMinutes } from "date-fns"
import {
  isBullishDivergence,
  isBullishEngulfing,
} from "../../blackbox/patterns"
import { isAboveEMA } from "../../blackbox/indicators/ema"
import { isVolumeIncreasing } from "../../blackbox/indicators/volume"

const boolToSignal = (value: boolean): Signal => (value ? 1 : 0)

type SignalOpts = {
  analysis: Analyze
  currentPrice: number
  candles3: Candle[]
  candles15: Candle[]
  candles30: Candle[]
  candles240: Candle[]
}

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
    !analysis.macd?.histogram ||
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
        stochiRSI
      // && bullishEngulfing
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

export function sellLongSignal(
  trade: ExecutionV5,
  currentPrice: number,
  candles1: Candle[],
  candles3: Candle[],
  candles15: Candle[],
  candles30: Candle[]
): MetaSignal {
  // const pnl = parseFloat(coin.cumRealisedPnl)
  // const takeProfitPnl = 0.2
  // const stopLossPnl = -0.5
  // const takeProfit = pnl > takeProfitPnl
  // const stopLoss = pnl < stopLossPnl

  // if (takeProfit || stopLoss) {
  //   return {
  //     signal: -1,
  //     indicators: [
  //       { name: `Take Profit or Stop Loss Triggered`, signal: -1, data: pnl },
  //     ],
  //   }
  // }

  // if (isBearishEngulfing(candles30)) {
  //   return {
  //     signal: -1,
  //     indicators: [{ name: "Bearish Engulfing detected", signal: -1 }],
  //   }
  // }
  // const isBearishTrend = !isAboveEMA(candles30, 50) // Проверка через EMA

  // if (!isBearishTrend) {
  //   return {
  //     signal: 0,
  //     indicators: [{ name: "Bearish trend not confirmed", signal: 0 }],
  //   }
  // }

  // const macd = MACD.calculate({
  //   values: candles30.map((candle) => candle.close),
  //   fastPeriod: 8,
  //   slowPeriod: 21,
  //   signalPeriod: 5,
  //   SimpleMAOscillator: false,
  //   SimpleMASignal: false,
  // })

  // if (
  //   isBearishDivergence(
  //     candles30,
  //     macd.map((h) => h.histogram!)
  //   )
  // ) {
  //   return {
  //     signal: -1,
  //     indicators: [{ name: "Bearish Divergence Detected", signal: -1 }],
  //   }
  // }

  const buyedTime = parseInt(trade.execTime)
  const stayTime = addMinutes(buyedTime, 30).getTime()

  if (stayTime > Date.now()) {
    return {
      signal: 0,
      indicators: [
        {
          name: "Wait 15 min",
          signal: 0,
          data: `${stayTime - Date.now() / 1000} need more seconds`,
        },
      ],
    }
  }

  const { signal: st3 } = getSupertrendSignal(currentPrice, candles3, 10, 2)
  const { signal: st15 } = getSupertrendSignal(currentPrice, candles15, 10, 2)
  // const { signal: st30 } = getSupertrendSignal(currentPrice, candles30, 10, 2)

  const signal = getCrossingSignal([st3, st15])

  return {
    signal,
    indicators: [
      { name: "Supertrend 3m", signal: st3 },
      { name: "Supertrend 15m", signal: st15 },
      // { name: "Supertrend 30m", signal: st30 },
    ],
  }
}
