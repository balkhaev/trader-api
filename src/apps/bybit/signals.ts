import { PositionV5 } from "bybit-api"
import { Analyze, Candle, Signal } from "../../types"
import { getSupertrendSignal } from "../blackbox/signals/supertrend"
import { getCrossingSignal } from "../blackbox/strategies"
import { BUY_SIGNAL_CANDLES_LIMIT } from "./consts"

export type MetaSignal = {
  signal: Signal
  indicators: {
    name: string
    signal?: any
    data?: string | number
  }[]
  newTrend?: boolean
}

type BuySignalOpts = {
  analysis: Analyze
  currentPrice: number
  candles3: Candle[]
  candles15: Candle[]
  candles30: Candle[]
}

export function buySignal({
  analysis,
  currentPrice,
  candles3,
  candles15,
  candles30,
}: BuySignalOpts): MetaSignal {
  const { signal: st3min, newTrend: st3minTrend } = getSupertrendSignal(
    currentPrice,
    candles3,
    BUY_SIGNAL_CANDLES_LIMIT,
    2
  )

  const { signal: st15min } = getSupertrendSignal(
    currentPrice,
    candles15,
    BUY_SIGNAL_CANDLES_LIMIT,
    2
  )

  const { signal: st30min } = getSupertrendSignal(
    currentPrice,
    candles30,
    BUY_SIGNAL_CANDLES_LIMIT,
    2
  )

  if (!analysis.rsi || !analysis.adx || !analysis.cci) {
    return {
      signal: 0,
      indicators: [
        {
          name: "No tech info :(",
          signal: analysis.rsi,
        },
      ],
    }
  }

  if (analysis.rsi > 60) {
    return {
      signal: 0,
      indicators: [
        {
          name: `High RSI (> 60)`,
          signal: 0,
          data: analysis.rsi,
        },
      ],
    }
  }

  if (analysis.adx?.adx < 15) {
    return {
      signal: 0,
      indicators: [
        {
          name: "Weak ADX trend (< 15)",
          signal: 0,
          data: analysis.adx?.adx,
        },
      ],
    }
  }

  if (analysis.adx.pdi < analysis.adx.mdi) {
    return {
      signal: 0,
      indicators: [
        {
          name: "-ADX > +ADX",
          signal: 0,
          data: analysis.adx?.adx,
        },
      ],
    }
  }

  if (analysis.cci > 100) {
    return {
      signal: 0,
      indicators: [
        {
          name: "CCI > 100",
          signal: 0,
          data: analysis.cci,
        },
      ],
    }
  }

  if (analysis.macd) {
    if (analysis.macd.histogram && analysis.macd.histogram < 0) {
      return {
        signal: 0,
        indicators: [
          {
            name: "MACD Histogram < 0",
            signal: analysis.macd.MACD,
          },
        ],
      }
    }
  }

  // const { signal: st60min } =
  //   getSupertrendSignal(currentPrice, candles60, BUY_SIGNAL_CANDLES_LIMIT, 1)

  // const { signal: st240min } =
  //   getSupertrendSignal(currentPrice, candles240, BUY_SIGNAL_CANDLES_LIMIT, 1)

  return {
    signal: getCrossingSignal([st3min, st15min, st30min, st3minTrend ? 1 : 0]),
    indicators: [
      {
        name: "ST (10,3) 3 min",
        signal: st3min,
      },
      {
        name: "ST (10,2) 15 min",
        signal: st15min,
      },
      {
        name: "ST (10,2) 30 min",
        signal: st30min,
      },
      {
        name: "ADX",
        signal: 1,
        data: analysis.adx.adx,
      },
      {
        name: "CCI",
        signal: 1,
        data: analysis.cci,
      },
      {
        name: "MACD",
        signal: 1,
        data: analysis.macd?.MACD,
      },
      {
        name: "RSI",
        signal: 1,
        data: analysis.rsi,
      },
    ],
  }
}

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
  candles1: Candle[],
  candles3: Candle[],
  candles15: Candle[],
  candles30: Candle[]
): MetaSignal {
  const takeProfitPnl = 0.2
  const stopLossPnl = -0.5

  const pnl = parseFloat(position.unrealisedPnl)

  const takeProfit = pnl > takeProfitPnl
  const stopLoss = stopLossPnl > pnl

  const shortPeriod = 10
  const shortMultiplier = 2
  const longPeriod = 10
  const longMultiplier = 2

  const { signal: st1 } = getSupertrendSignal(
    currentPrice,
    candles1,
    shortPeriod,
    shortMultiplier
  )
  const { signal: st3 } = getSupertrendSignal(
    currentPrice,
    candles3,
    shortPeriod,
    shortMultiplier
  )
  const { signal: st15 } = getSupertrendSignal(
    currentPrice,
    candles15,
    longPeriod,
    longMultiplier
  )

  const { signal: st30 } = getSupertrendSignal(
    currentPrice,
    candles30,
    BUY_SIGNAL_CANDLES_LIMIT,
    2
  )

  const signal = (() => {
    if (takeProfit) {
      if (pnl / takeProfitPnl > 1.5) {
        return st1
      }

      return -1
    }

    if (stopLoss) {
      if (pnl / stopLossPnl > 1.5) {
        return st1
      }

      return -1
    }

    return getCrossingSignal([st3, st15, st30])
  })()

  return {
    signal,
    indicators: [
      {
        name: `Supertrend (${shortPeriod},${shortMultiplier}) on 1m candles`,
        signal: st1,
      },
      {
        name: `Supertrend (${shortPeriod},${shortMultiplier}) on 3m candles`,
        signal: st3,
      },
      {
        name: `Supertrend (${longPeriod},${longMultiplier}) on 15m candles`,
        signal: st15,
      },
      {
        name: `Supertrend (${longPeriod},${longMultiplier}) on 30m candles`,
        signal: st30,
      },
      {
        name: `Take profit > ${pnl}$ (${takeProfitPnl})`,
        signal: takeProfit,
      },
      {
        name: `Stop loss > ${pnl}$ (${stopLossPnl})`,
        signal: stopLoss,
      },
    ],
  }
}
