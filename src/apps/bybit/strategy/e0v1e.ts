import { getTechnicalAnalyze } from "../../blackbox/indicators"
import { isAboveEMA } from "../../blackbox/indicators/ema"
import { getSupertrendSignal } from "../../blackbox/signals/supertrend"
import { getCrossingSignal } from "../../blackbox/strategies"
import { MetaSignal, SignalOpts, SignalSellOpts } from "../types"
import { boolToSignal } from "../utils"

const BUY_RSI_FAST_32 = 40
const BUY_RSI_32 = 42
const BUY_SMA15_32 = 0.973
const BUY_CTI_32 = 0.69

export function buyEovieSignal({
  currentPrice,
  candles30,
  candles240,
}: SignalOpts): MetaSignal {
  const analyze = getTechnicalAnalyze(candles30)

  // We assume getTechnicalAnalyze returns rsi, rsi_fast, rsi_slow, cti, sma and so forth.
  // If not, you need to modify getTechnicalAnalyze to also return these values.
  if (
    !analyze.rsi ||
    !analyze.sma ||
    !analyze.rsiFast ||
    !analyze.rsiSlow ||
    !analyze.cti
  ) {
    return { signal: 0, indicators: [{ name: "Insufficient Data", signal: 0 }] }
  }

  // Get global trend from supertrend (as an example)
  const { signal: globalTrend } = getSupertrendSignal(
    currentPrice,
    candles240,
    10,
    2
  )

  // Check for bullish trend (above EMA200)
  const isBullishTrend = isAboveEMA(candles240, 200).above

  // To replicate (rsi_slow < rsi_slow.shift(1)) from python, we need previous candle's rsi_slow.
  // Assuming we can call getTechnicalAnalyze on previous candles.
  // If not, you'll need a different approach (like computing indicators for all candles and taking the second last).
  const prevAnalyze = getTechnicalAnalyze(candles30.slice(0, -1))
  if (!prevAnalyze.rsiSlow) {
    return {
      signal: 0,
      indicators: [{ name: "Insufficient Data for prev RSI slow", signal: 0 }],
    }
  }

  const rsiSlowDecreasing = analyze.rsiSlow < prevAnalyze.rsiSlow

  // Conditions taken from the Python strategy
  const conditions = [
    rsiSlowDecreasing,
    analyze.rsiFast < BUY_RSI_FAST_32,
    analyze.rsi > BUY_RSI_32,
    currentPrice < analyze.sma * BUY_SMA15_32,
    analyze.cti < BUY_CTI_32,
  ]

  const buySignal = conditions.every(Boolean) && globalTrend && isBullishTrend

  return {
    signal: getCrossingSignal([boolToSignal(buySignal), globalTrend]),
    indicators: [
      { name: "global trend", signal: globalTrend },
      {
        name: "rsi_slow decreasing",
        signal: boolToSignal(rsiSlowDecreasing),
        data: { current: analyze.rsiSlow, prev: prevAnalyze.rsiSlow },
      },
      {
        name: "rsi_fast < BUY_RSI_FAST_32",
        signal: boolToSignal(analyze.rsiFast < BUY_RSI_FAST_32),
        data: analyze.rsiFast,
      },
      {
        name: "rsi > BUY_RSI_32",
        signal: boolToSignal(analyze.rsi > BUY_RSI_32),
        data: analyze.rsi,
      },
      {
        name: "price < sma * BUY_SMA15_32",
        signal: boolToSignal(currentPrice < analyze.sma * BUY_SMA15_32),
        data: { price: currentPrice, sma: analyze.sma },
      },
      {
        name: "cti < BUY_CTI_32",
        signal: boolToSignal(analyze.cti < BUY_CTI_32),
        data: analyze.cti,
      },
      { name: "bullish trend", signal: boolToSignal(isBullishTrend) },
    ],
  }
}

export function sellEovieSignal({
  currentPrice,
  candles30,
  candles240,
}: SignalSellOpts): MetaSignal {
  const analyze = getTechnicalAnalyze(candles30)

  if (
    !analyze.rsi ||
    !analyze.stochasticRsi ||
    !analyze.macd ||
    !analyze.sma ||
    !analyze.cci
  ) {
    return { signal: 0, indicators: [{ name: "Insufficient Data", signal: 0 }] }
  }

  const isBearishTrend = !isAboveEMA(candles240, 200).above

  // Условия для выхода из сделки (продажа)
  const sellConditions = [
    analyze.rsi > 70, // RSI указывает на перекупленность
    analyze.cci > 100, // CCI указывает на перекупленность
    currentPrice > analyze.sma * 1.04, // Цена выше SMA, что сигнализирует о возможном развороте
    analyze.stochasticRsi.stochRSI > 80, // Stochastic RSI указывает на перекупленность
  ]

  const sellSignal = sellConditions.some(Boolean) && isBearishTrend

  return {
    signal: boolToSignal(sellSignal),
    indicators: [
      {
        name: "RSI Overbought",
        signal: boolToSignal(analyze.rsi > 70),
        data: analyze.rsi,
      },
      {
        name: "Price above SMA",
        signal: boolToSignal(currentPrice > analyze.sma * 1.04),
      },
      {
        name: "Stochastic RSI Overbought",
        signal: boolToSignal(analyze.stochasticRsi.stochRSI > 80),
        data: analyze.stochasticRsi.stochRSI,
      },
      {
        name: "CCI Overbought",
        signal: boolToSignal(analyze.cci > 100),
        data: analyze.cci,
      },
      {
        name: "Global Trend Bearish",
        signal: boolToSignal(isBearishTrend),
      },
    ],
  }
}
