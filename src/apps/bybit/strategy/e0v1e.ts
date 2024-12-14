import { getTechnicalAnalyze } from "../../blackbox/indicators"
import { isAboveEMA } from "../../blackbox/indicators/ema"
import { getSupertrendSignal } from "../../blackbox/signals/supertrend"
import { getCrossingSignal } from "../../blackbox/strategies"
import { MetaSignal, SignalOpts, SignalSellOpts } from "../types"
import { boolToSignal } from "../utils"

export function buyEovieSignal({
  currentPrice,
  candles30,
  candles240,
}: SignalOpts): MetaSignal {
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

  const { signal: globalTrend } = getSupertrendSignal(
    currentPrice,
    candles240,
    10,
    2
  )

  const isBullishTrend = isAboveEMA(candles240, 200).above

  const buyConditions = [
    analyze.rsi > 28,
    analyze.rsi < 50,
    analyze.cci < -100,
    currentPrice < analyze.sma * 0.96,
    analyze.stochasticRsi.stochRSI < 20,
  ]

  const buySignal =
    buyConditions.every(Boolean) && globalTrend && isBullishTrend

  return {
    signal: getCrossingSignal([boolToSignal(buySignal), globalTrend]),
    indicators: [
      {
        name: "Global trend",
        signal: globalTrend,
      },
      {
        name: "RSI within range",
        signal: boolToSignal(analyze.rsi > 28 && analyze.rsi < 50),
      },
      {
        name: "Price below SMA",
        signal: boolToSignal(currentPrice < analyze.sma * 0.96),
      },
      {
        name: "Stochastic RSI Oversold",
        signal: boolToSignal(analyze.stochasticRsi.stochRSI < 20),
      },
      { name: "Global Trend Bullish", signal: boolToSignal(globalTrend) },
      {
        name: "CCI Oversold",
        signal: boolToSignal(analyze.cci < -100),
        data: analyze.cci,
      },
      { name: "Above EMA 200", signal: boolToSignal(isBullishTrend) },
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
