import { Candle, Signal } from "../../types"
import { getSupertrendSignal } from "./signals/supertrend"

/**
 * Функция проверки пересечения сигналов
 */
export function checkSignalsCrossing(signals: Signal[]): Signal {
  const firstSignal = signals[0]
  const allEqual = signals.every((s) => s === firstSignal)

  if (!allEqual) return 0

  return firstSignal
}

export function getSupertrendCrossingSignal(
  lastPrice: number,
  candles: Candle[],
  opts: any[]
) {
  return checkSignalsCrossing(
    opts.map((cfg) =>
      getSupertrendSignal(lastPrice, candles, cfg.period, cfg.multiplier)
    )
  )
}
