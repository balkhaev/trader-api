import { Candle } from "../../../types"

function getEMA(candles: Candle[], period: number): number {
  const sum = candles
    .slice(-period)
    .reduce((acc, candle) => acc + candle.close, 0)
  return sum / period
}

export function isAboveEMA(
  candles: Candle[],
  period: number
): { above: boolean; diff: number } {
  const ema = getEMA(candles, period)
  const currentPrice = candles[candles.length - 1].close
  return { above: currentPrice > ema, diff: currentPrice - ema }
}
