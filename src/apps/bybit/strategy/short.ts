import { Analyze, Candle } from "../../../types"
import { getSupertrendSignal } from "../../blackbox/signals/supertrend"
import { getCrossingSignal, reverseSignal } from "../../blackbox/strategies"
import { MetaSignal } from "../types"
import { isAboveEMA } from "../../blackbox/indicators/ema"
import { Tables } from "../../../database.types"
import { boolToSignal } from "../utils"

const BUY_SIGNAL_CANDLES_LIMIT = 10

type SignalOpts = {
  analysis: Analyze
  currentPrice: number
  candles1: Candle[]
  candles3: Candle[]
  candles15: Candle[]
  candles30: Candle[]
  candles240: Candle[]
}

export function buyShortSignal({
  analysis,
  currentPrice,
  candles1,
  candles3,
  candles15,
  candles30,
  candles240,
}: SignalOpts): MetaSignal {
  const adx = boolToSignal(analysis.adx?.adx ? analysis.adx?.adx > 25 : false)
  const globalBullish = boolToSignal(isAboveEMA(candles240, 200).diff > 0)
  const { signal: st240min } = getSupertrendSignal(
    currentPrice,
    candles240,
    BUY_SIGNAL_CANDLES_LIMIT,
    1
  )
  const { signal: st30min } = getSupertrendSignal(
    currentPrice,
    candles30,
    BUY_SIGNAL_CANDLES_LIMIT,
    1
  )
  const { signal: st15min } = getSupertrendSignal(
    currentPrice,
    candles15,
    BUY_SIGNAL_CANDLES_LIMIT,
    1
  )
  const { signal: st3min } = getSupertrendSignal(
    currentPrice,
    candles3,
    BUY_SIGNAL_CANDLES_LIMIT,
    1
  )
  const { signal: st1min } = getSupertrendSignal(
    currentPrice,
    candles1,
    BUY_SIGNAL_CANDLES_LIMIT,
    1
  )

  const st1Reversed = reverseSignal(st1min)
  const st3Reversed = reverseSignal(st3min)

  return {
    signal: getCrossingSignal([
      st1Reversed,
      st3Reversed,
      st15min,
      st30min,
      st240min,
      adx,
      globalBullish,
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
        name: "Supertrend 15 min",
        signal: st15min,
      },
      {
        name: "Supertrend 30 min",
        signal: st30min,
      },
      {
        name: "Supertrend 240 min",
        signal: st240min,
      },
      {
        name: "Powered ADX > 25",
        signal: adx,
      },
      {
        name: "EMA 240min 200 > 0",
        signal: globalBullish,
      },
    ],
  }
}

export function sellShortSignal(
  buy: Tables<"buys">,
  currentPrice: number,
  candles1: Candle[],
  candles3: Candle[]
): MetaSignal {
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
