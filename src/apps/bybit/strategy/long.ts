import { ExecutionV5, WalletBalanceV5Coin } from "bybit-api"
import { Analyze, Candle } from "../../../types"
import { getSupertrendSignal } from "../../blackbox/signals/supertrend"
import { getCrossingSignal } from "../../blackbox/strategies"
import { BUY_SIGNAL_CANDLES_LIMIT } from "../consts"
import { ATR, MACD } from "technicalindicators"
import { MetaSignal } from "../types"
import { addMinutes } from "date-fns"

function isBullishEngulfing(candles: Candle[]): boolean {
  const [prev, last] = candles.slice(-2)
  return (
    prev.close < prev.open &&
    last.close > last.open &&
    last.close > prev.open &&
    last.open < prev.close
  )
}

function isAboveEMA(candles: Candle[], period: number): boolean {
  const ema =
    candles.slice(-period).reduce((sum, candle) => sum + candle.close, 0) /
    period
  return candles[candles.length - 1].close > ema
}

function calculateATR(candles: Candle[]): number {
  return (
    ATR.calculate({
      low: candles.map((c) => c.low),
      high: candles.map((c) => c.high),
      close: candles.map((c) => c.close),
      period: 10,
    }).pop() || 0
  )
}

function isVolumeIncreasing(candles: Candle[]): boolean {
  const [prev, last] = candles.slice(-2)
  return last.volume > prev.volume
}

function isBullishDivergence(candles: Candle[], macdHist: number[]): boolean {
  const prices = candles.map((c) => c.close)
  const lastPrice = prices[prices.length - 1]
  const prevPrice = prices[prices.length - 2]
  const lastMACD = macdHist[macdHist.length - 1]
  const prevMACD = macdHist[macdHist.length - 2]

  return (
    lastPrice > prevPrice && // Цена делает более высокие минимумы
    lastMACD < prevMACD // MACD гистограмма делает более низкие минимумы
  )
}

function isBearishEngulfing(candles: Candle[]): boolean {
  const [prev, last] = candles.slice(-2)
  return (
    prev.close > prev.open &&
    last.close < last.open &&
    last.close < prev.open &&
    last.open > prev.close
  )
}

function isBearishDivergence(candles: Candle[], macdHist: number[]): boolean {
  const prices = candles.map((c) => c.close)
  const lastPrice = prices[prices.length - 1]
  const prevPrice = prices[prices.length - 2]
  const lastMACD = macdHist[macdHist.length - 1]
  const prevMACD = macdHist[macdHist.length - 2]

  return (
    lastPrice < prevPrice && // Цена делает более низкие максимумы
    lastMACD > prevMACD // MACD гистограмма делает более высокие максимумы
  )
}

type SignalOpts = {
  analysis: Analyze
  currentPrice: number
  candles3: Candle[]
  candles15: Candle[]
  candles30: Candle[]
  candles240: Candle[]
}

export function buySignal({
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

  if (
    isBullishDivergence(
      candles30,
      macd.map((m) => m.histogram!)
    ) &&
    isVolumeIncreasing(candles30) &&
    analysis.adx.adx > 25 &&
    isAboveEMA(candles240, 200) &&
    analysis.rsi > 30 &&
    analysis.stochasticRsi.stochRSI < 20 &&
    isBullishEngulfing(candles15)
  ) {
    return {
      signal: 1,
      indicators: [
        { name: "Bullish Divergence Detected", signal: 1 },
        { name: "Volume Increasing", signal: 1 },
        { name: "ADX Confirms Trend", signal: 1, data: analysis.adx.adx },
        { name: "EMA Trend Confirms", signal: 1 },
        { name: "RSI Oversold", signal: 1, data: analysis.rsi },
        {
          name: "Stochastic RSI Oversold",
          signal: 1,
          data: analysis.stochasticRsi.stochRSI,
        },
        { name: "Bullish Engulfing Pattern", signal: 1 },
      ],
    }
  }

  // if (
  //   isBullishDivergence(
  //     candles30,
  //     macd.map((m) => m.histogram!)
  //   ) &&
  //   analysis.adx.adx > 25 &&
  //   analysis.rsi > 30 &&
  //   isAboveEMA(candles240, 200)
  // ) {
  //   return {
  //     signal: 1,
  //     indicators: [
  //       { name: "Bullish Divergence Detected", signal: 1 },
  //       { name: "ADX > 25", signal: 1, data: analysis.adx.adx },
  //       { name: "rsi > 30", signal: 1, data: analysis.rsi },
  //       { name: "Above 200 EMA", signal: 1 },
  //     ],
  //   }
  // }

  // const atr = calculateATR(candles30)
  // const takeProfitLevel = currentPrice + atr * 3
  // const stopLossLevel = currentPrice - atr * 2

  // if (analysis.stochasticRsi.stochRSI <= 20 && isBullishEngulfing(candles15)) {
  //   return {
  //     signal: 1,
  //     indicators: [
  //       {
  //         name: "Bullish Engulfing & Stochastic RSI Oversold",
  //         signal: 1,
  //         data: analysis.stochasticRsi.stochRSI,
  //       },
  //       { name: "ATR Take Profit", data: takeProfitLevel },
  //       { name: "ATR Stop Loss", data: stopLossLevel },
  //     ],
  //   }
  // }

  // if (analysis.stochasticRsi.stochRSI > 80) {
  //   return {
  //     signal: 0,
  //     indicators: [
  //       {
  //         name: "Stochastic RSI Overbought",
  //         signal: 0,
  //         data: analysis.stochasticRsi.stochRSI,
  //       },
  //     ],
  //   }
  // }

  // if (
  //   analysis.stochasticRsi.stochRSI > 40 &&
  //   analysis.adx.adx >= 25 &&
  //   analysis.macd.histogram > 0
  // ) {
  //   return {
  //     signal: 1,
  //     indicators: [
  //       {
  //         name: "Stoch RSI",
  //         signal: 1,
  //         data: analysis.stochasticRsi.stochRSI,
  //       },
  //       { name: "ADX >= 25", signal: 1, data: analysis.adx.adx },
  //       {
  //         name: "MACD Histogram > 0",
  //         signal: 1,
  //         data: analysis.macd.histogram,
  //       },
  //       { name: "ATR Take Profit", data: takeProfitLevel },
  //       { name: "ATR Stop Loss", data: stopLossLevel },
  //     ],
  //   }
  // }

  return { signal: 0, indicators: [{ name: "No Valid Signal", signal: 0 }] }
}

export function sellSignal(
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
  const stayTime = addMinutes(buyedTime, 15).getTime()

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
