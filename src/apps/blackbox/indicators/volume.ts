import { Candle } from "../../../types"

export function isVolumeIncreasing(candles: Candle[]): boolean {
  const [prev, last] = candles.slice(-2)
  return last.volume > prev.volume
}
