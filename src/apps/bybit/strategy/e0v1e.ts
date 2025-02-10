import { Signal } from "../../../types"
import { getTechnicalAnalyze } from "../../blackbox/analyze"
import { MetaSignal, SignalOpts, SignalSellOpts } from "../types"
import { boolToSignal } from "../utils"

const BUY_RSI_FAST_32 = 40
const BUY_RSI_32 = 42
const BUY_SMA15_32 = 0.973
const BUY_CTI_32 = 0.69

export function buyEovieSignal({
  currentPrice,
  candles30,
}: SignalOpts): MetaSignal {
  const analyze = getTechnicalAnalyze(candles30)

  // Проверяем, что необходимые индикаторы доступны
  if (
    !analyze.rsi ||
    !analyze.sma ||
    !analyze.rsiFast ||
    !analyze.rsiSlow ||
    !analyze.cti
  ) {
    return { signal: 0, indicators: [{ name: "Insufficient Data", signal: 0 }] }
  }

  // Берём предыдущее значение для rsiSlow
  const prevAnalyze = getTechnicalAnalyze(candles30.slice(0, -1))
  if (!prevAnalyze.rsiSlow) {
    return {
      signal: 0,
      indicators: [
        { name: "Insufficient Data for previous rsiSlow", signal: 0 },
      ],
    }
  }

  // Проверяем условие уменьшения rsiSlow (rsi_slow < rsi_slow.shift(1))
  const rsiSlowDecreasing = analyze.rsiSlow < prevAnalyze.rsiSlow

  // Применяем те же условия, что и в Python
  const conditions = [
    rsiSlowDecreasing,
    analyze.rsiFast < BUY_RSI_FAST_32,
    analyze.rsi > BUY_RSI_32,
    currentPrice < analyze.sma * BUY_SMA15_32,
    analyze.cti < BUY_CTI_32,
  ]

  const buySignal = conditions.every(Boolean) // Все условия должны быть истинны

  return {
    signal: boolToSignal(buySignal),
    indicators: [
      {
        name: "rsi_slow decreasing",
        signal: boolToSignal(rsiSlowDecreasing),
        data: `rsiSlow_current: ${analyze.rsiSlow}, prev: ${prevAnalyze.rsiSlow} }`,
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
        data: `price: ${currentPrice.toFixed(1)}, sma: ${analyze.sma.toFixed(
          1
        )} `,
      },
      {
        name: "cti < BUY_CTI_32",
        signal: boolToSignal(analyze.cti < BUY_CTI_32),
        data: analyze.cti,
      },
    ],
  }
}

const SELL_FASTX = 84
const SELL_LOSS_CCI = 120
const SELL_LOSS_CCI_PROFIT = -0.05

const TMP_HOLD = new Set<number>()
const TMP_HOLD1 = new Set<number>()

export function sellEovieSignal({
  currentPrice,
  candles30,
  candles1,
  buy,
  currentProfit,
}: SignalSellOpts): MetaSignal {
  const openRate = buy.price
  const tradeId = buy.id
  const tradeOpenTime = new Date(buy.created_at)
  const currentTime = new Date()
  const analyze = getTechnicalAnalyze(candles30)

  if (
    !analyze.rsi ||
    !analyze.stochasticRsi ||
    !analyze.macd ||
    !analyze.sma ||
    !analyze.cci ||
    !analyze.fastk ||
    !analyze.ma120 ||
    !analyze.ma240
  ) {
    return { signal: 0, indicators: [{ name: "Insufficient Data", signal: 0 }] }
  }

  if (
    !TMP_HOLD.has(tradeId) &&
    analyze.ma120 !== null &&
    analyze.ma240 !== null
  ) {
    if (openRate > analyze.ma120 && openRate > analyze.ma240) {
      TMP_HOLD.add(tradeId)
    }
  }

  if (!TMP_HOLD1.has(tradeId) && analyze.ma120 !== null) {
    const diff = (openRate - analyze.ma120) / openRate
    if (diff >= 0.1) {
      TMP_HOLD1.add(tradeId)
    }
  }

  const recentCandles1 = candles1.filter(
    (candle) => candle.time! >= tradeOpenTime.getTime()
  )

  let minRate = buy.price
  if (recentCandles1.length > 0) {
    minRate = recentCandles1.reduce(
      (acc, candle) => (candle.low < acc ? candle.low : acc),
      recentCandles1[0].low
    )
  }

  const minProfit = minRate / openRate - 1

  let fastkProfitSell = false
  const openTimePlus9m55s = new Date(
    tradeOpenTime.getTime() + 9 * 60000 + 55000
  )
  if (currentProfit > 0) {
    if (currentTime > openTimePlus9m55s) {
      if (analyze.fastk > SELL_FASTX) {
        fastkProfitSell = true
      }
    } else {
      if (analyze.fastk > SELL_FASTX) {
        fastkProfitSell = true
      }
    }
  }

  let cciLossSell = false
  if (
    minProfit <= -0.1 &&
    currentProfit > SELL_LOSS_CCI_PROFIT &&
    analyze.cci > SELL_LOSS_CCI
  ) {
    cciLossSell = true
  }

  let ma120SellFast = false
  if (
    TMP_HOLD1.has(tradeId) &&
    analyze.ma120 !== null &&
    currentPrice < analyze.ma120
  ) {
    ma120SellFast = true
  }

  let ma120Sell = false
  if (
    TMP_HOLD.has(tradeId) &&
    analyze.ma120 !== null &&
    analyze.ma240 !== null &&
    currentPrice < analyze.ma120 &&
    currentPrice < analyze.ma240 &&
    minProfit <= -0.1
  ) {
    ma120Sell = true
  }

  let finalSignal: Signal = 0
  let reason = ""

  if (fastkProfitSell) {
    finalSignal = -1
    reason = "fastk_profit_sell"
  } else if (cciLossSell) {
    finalSignal = -1
    reason = "cci_loss_sell"
  } else if (ma120SellFast) {
    finalSignal = -1
    reason = "ma120_sell_fast"
    TMP_HOLD1.delete(tradeId)
  } else if (ma120Sell) {
    finalSignal = -1
    reason = "ma120_sell"
    TMP_HOLD.delete(tradeId)
  }

  return {
    signal: finalSignal,
    indicators: [
      {
        name: "Reason",
        signal: finalSignal,
        data: reason,
      },
      {
        name: "fastk",
        signal: boolToSignal(analyze.fastk > SELL_FASTX),
        data: analyze.fastk,
      },
      {
        name: "cci",
        signal: boolToSignal(analyze.cci > SELL_LOSS_CCI),
        data: analyze.cci,
      },
      {
        name: "currentProfit",
        signal: boolToSignal(currentProfit > 0),
        data: currentProfit,
      },
      {
        name: "minProfit",
        signal: boolToSignal(minProfit),
        data: minProfit,
      },
      {
        name: "ma120",
        signal: boolToSignal(currentPrice < analyze.ma120),
        data: analyze.ma120,
      },
      {
        name: "ma240",
        signal: boolToSignal(currentPrice < analyze.ma240),
        data: analyze.ma240,
      },
    ],
  }
}
