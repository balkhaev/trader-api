import { getSupertrendSignal } from "../../blackbox/signals/supertrend"
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

export function buyRsiSignal({
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

  // Проверяем наличие необходимых данных
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

  // Проверяем глобальный бычий тренд по EMA200
  const { above: isBullishTrend } = isAboveEMA(candles240, 200)

  if (!isBullishTrend) {
    return {
      signal: 0,
      indicators: [{ name: "Global EMA trend bearish", signal: 0 }],
    }
  }

  // Проверяем краткосрочный тренд на 3-минутных свечах
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

  // Расчёт MACD для 30-минутного таймфрейма
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
  const aboveEMA = isBullishTrend // Уже определено выше
  const rsiOversold = analysis.rsi < 30
  const stochiRSI = analysis.stochasticRsi.stochRSI < 20
  const bullishEngulfing = isBullishEngulfing(candles15)

  // Считаем количество подтверждающих сигналов
  const confirmSignals = [
    rsiOversold,
    bullishDivergence,
    volumeIncreasing,
    adxPower,
    aboveEMA,
    stochiRSI,
    bullishEngulfing,
  ]

  const trueCount = confirmSignals.filter(Boolean).length

  // Нам нужно минимум 2 подтверждающих сигнала помимо RSI
  const finalSignal = trueCount >= 2 ? 1 : 0

  return {
    signal: finalSignal,
    indicators: [
      {
        name: "RSI Oversold (<30)",
        signal: boolToSignal(rsiOversold),
        data: analysis.rsi,
      },
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

export function sellRsiSignal({
  buy,
  currentPrice,
  candles3, // Предположим, что мы используем 3-минутные свечи для отслеживания тренда
}: SignalSellOpts): MetaSignal {
  // Если не было сигнала на покупку, то и выходить не из чего
  if (!buy) {
    return { signal: 0, indicators: [{ name: "No buy signal", signal: 0 }] }
  }

  // Получаем сигнал супер-тренда с теми же параметрами, что использовали для входа
  // Например, при входе мы использовали BUY_SIGNAL_CANDLES_LIMIT = 10 и multiplier = 2
  const BUY_SIGNAL_CANDLES_LIMIT = 10
  const MULTIPLIER = 2

  const { signal: supertrendSignal } = getSupertrendSignal(
    currentPrice,
    candles3,
    BUY_SIGNAL_CANDLES_LIMIT,
    MULTIPLIER
  )

  // Если супер-тренд перестал быть бычьим (signal вернул 0), значит тренд закончился.
  // Выходим из позиции.
  if (supertrendSignal === 0) {
    return {
      signal: -1,
      indicators: [
        {
          name: "Supertrend Reversal Detected",
          signal: -1,
          data: supertrendSignal,
        },
      ],
    }
  }

  // Если супер-тренд всё ещё бычий, то остаёмся в позиции
  return {
    signal: 0,
    indicators: [
      { name: "Trend Continues (Supertrend still bullish)", signal: 1 },
    ],
  }
}
