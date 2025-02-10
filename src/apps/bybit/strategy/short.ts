import { getSupertrendSignal } from "../../blackbox/signals/supertrend"
import { getCrossingSignal, reverseSignal } from "../../blackbox/utils"
import { MetaSignal, SignalOpts, SignalSellOpts } from "../types"
import { isAboveEMA } from "../../blackbox/indicators/ema"
import { boolToSignal } from "../utils"
import { getTechnicalAnalyze } from "../../blackbox/analyze"

const BUY_SIGNAL_CANDLES_LIMIT = 10

export function buyShortSignal({
  currentPrice,
  candles1,
  candles3,
  candles15,
  candles30,
  candles240,
}: SignalOpts): MetaSignal {
  const analyze = getTechnicalAnalyze(candles15)

  if (!analyze?.bollingerBands) {
    return { signal: 0, indicators: [{ name: "Insufficient Data", signal: 0 }] }
  }

  const bollingerBands = boolToSignal(
    currentPrice > analyze?.bollingerBands?.middle &&
      currentPrice > analyze?.bollingerBands.upper
  )
  const adx = boolToSignal(analyze?.adx?.adx ? analyze.adx?.adx > 25 : false)
  const isGoldenCross = boolToSignal(
    isAboveEMA(candles30, 50).diff > isAboveEMA(candles30, 200).diff
  )
  const isStrongBullish = boolToSignal(
    currentPrice > isAboveEMA(candles30, 200).diff
  )
  const { signal: st3min } = getSupertrendSignal(
    currentPrice,
    candles3,
    BUY_SIGNAL_CANDLES_LIMIT,
    2
  )
  const { signal: st1min } = getSupertrendSignal(
    currentPrice,
    candles1,
    BUY_SIGNAL_CANDLES_LIMIT,
    2
  )

  const st1Reversed = reverseSignal(st1min)
  const st3Reversed = reverseSignal(st3min)

  return {
    signal: getCrossingSignal([
      st1Reversed,
      st3Reversed,
      adx,
      isGoldenCross,
      isStrongBullish,
    ]),
    indicators: [
      {
        name: "Supertrend reversed 1 min",
        signal: st1Reversed,
      },
      {
        name: "Supertrend reversed 3 min",
        signal: st3Reversed,
      },
      {
        name: "BB OK",
        signal: bollingerBands,
      },
      {
        name: "Is golden cross",
        signal: isGoldenCross,
      },
      {
        name: "Is strong bullish",
        signal: isStrongBullish,
      },
      {
        name: "Powered ADX > 25",
        signal: adx,
      },
    ],
  }
}

export function sellShortSignal({
  buy,
  currentPrice,
  candles1,
  candles3,
}: SignalSellOpts): MetaSignal {
  const pnl = parseFloat(buy.qty) * (currentPrice - buy.price)
  const takeProfit = buy.take_profit && pnl > buy.take_profit
  const stopLoss = buy.stop_loss && pnl < buy.stop_loss

  if (takeProfit || stopLoss) {
    return {
      signal: -1,
      indicators: [
        { name: `Take Profit or Stop Loss Triggered`, signal: -1, data: pnl },
      ],
    }
  }

  const { signal: st1 } = getSupertrendSignal(currentPrice, candles1, 10, 1)
  const { signal: st1f2 } = getSupertrendSignal(currentPrice, candles1, 10, 2)
  const { signal: st3 } = getSupertrendSignal(currentPrice, candles3, 10, 2)

  const signal = getCrossingSignal([st1, st1f2, st3])

  return {
    signal,
    indicators: [
      { name: "Supertrend 1m (10,1)", signal: st1 },
      { name: "Supertrend 1m (10,2)", signal: st1f2 },
      { name: "Supertrend 3m (10,2)", signal: st3 },
    ],
  }
}
