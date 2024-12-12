import { PositionV5 } from "bybit-api"
import { Candle } from "../../types"
import { getSupertrendSignal } from "../blackbox/signals/supertrend"
import { checkSignalsCrossing } from "../blackbox/strategies"
import { BUY_SIGNAL_CANDLES_LIMIT } from "./consts"

/**
 * Сигнал продажи
 *
 * Продаем при пересечении сигналов
 * 3 и 15 минут в супертренде
 *
 * Либо если больше takeProfit'a
 * То выходим по 3 минутному сигналу
 */
export function sellSignal(
  position: PositionV5,
  currentPrice: number,
  candles3: Candle[],
  candles15: Candle[]
) {
  const profit = 1
  const takeProfit = parseFloat(position.curRealisedPnl) > profit
  const shortPeriod = 10
  const shortMultiplier = 2
  const longPeriod = 10
  const longMultiplier = 1.5

  const st3 = getSupertrendSignal(
    currentPrice,
    candles3,
    shortPeriod,
    shortMultiplier
  )
  const st15 = getSupertrendSignal(
    currentPrice,
    candles15,
    longPeriod,
    longMultiplier
  )

  const signal = takeProfit ? st3 : checkSignalsCrossing([st3, st15])

  return {
    signal,
    indicators: [
      {
        name: `Supertrend (${shortPeriod},${shortMultiplier}) on 3m candles`,
        signal: st3,
      },
      {
        name: `Supertrend (${longPeriod},${longMultiplier}) on 15m candles`,
        signal: st15,
      },
      {
        name: `Take profit > ${profit}$`,
        signal: takeProfit,
      },
    ],
  }
}

export function buySignal(
  lastPrice: number,
  candles3: Candle[],
  candles15: Candle[],
  candles30: Candle[],
  candles60: Candle[],
  candles240: Candle[]
) {
  const supertrend3min = getSupertrendSignal(
    lastPrice,
    candles3,
    BUY_SIGNAL_CANDLES_LIMIT,
    3
  )
  const supertrend15min = getSupertrendSignal(
    lastPrice,
    candles15,
    BUY_SIGNAL_CANDLES_LIMIT,
    2
  )
  const supertrend30min = getSupertrendSignal(
    lastPrice,
    candles30,
    BUY_SIGNAL_CANDLES_LIMIT,
    2
  )
  const supertrend60min = getSupertrendSignal(
    lastPrice,
    candles60,
    BUY_SIGNAL_CANDLES_LIMIT,
    1
  )
  const supertrend240min = getSupertrendSignal(
    lastPrice,
    candles240,
    BUY_SIGNAL_CANDLES_LIMIT,
    1
  )

  return {
    signal: checkSignalsCrossing([
      supertrend3min,
      supertrend15min,
      supertrend30min,
      supertrend60min,
      supertrend240min,
    ]),
    indicators: [
      {
        name: "ST (10,3) 3 min",
        signal: supertrend3min,
      },
      {
        name: "ST (10,2) 15 min",
        signal: supertrend15min,
      },
      {
        name: "ST (10,2) 30 min",
        signal: supertrend30min,
      },
      {
        name: "ST (10,1) 60 min",
        signal: supertrend60min,
      },
      {
        name: "ST (10,1) 240 min",
        signal: supertrend240min,
      },
    ],
  }
}
