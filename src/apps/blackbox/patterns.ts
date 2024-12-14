import { Candle } from "../../types"

export function isBearishEngulfing(candles: Candle[]): boolean {
  const [prev, last] = candles.slice(-2)
  return (
    prev.close > prev.open &&
    last.close < last.open &&
    last.close < prev.open &&
    last.open > prev.close
  )
}

export function isBullishDivergence(
  candles: Candle[],
  macdHist: number[]
): boolean {
  const prices = candles.map((c) => c.close)
  const lastPrice = prices[prices.length - 1]
  const prevPrice = prices[prices.length - 2]
  const lastMACD = macdHist[macdHist.length - 1]
  const prevMACD = macdHist[macdHist.length - 2]

  return (
    lastPrice > prevPrice && // Цена делает более высокие минимумы
    lastMACD < prevMACD // MACD гистограмма делает более низкие минимумы
  )
}

export function isBearishDivergence(
  candles: Candle[],
  macdHist: number[]
): boolean {
  const prices = candles.map((c) => c.close)
  const lastPrice = prices[prices.length - 1]
  const prevPrice = prices[prices.length - 2]
  const lastMACD = macdHist[macdHist.length - 1]
  const prevMACD = macdHist[macdHist.length - 2]

  return (
    lastPrice < prevPrice && // Цена делает более низкие максимумы
    lastMACD > prevMACD // MACD гистограмма делает более высокие максимумы
  )
}

export function isBullishEngulfing(candles: Candle[]): boolean {
  const [prev, last] = candles.slice(-2)
  return (
    prev.close < prev.open &&
    last.close > last.open &&
    last.close > prev.open &&
    last.open < prev.close
  )
}
