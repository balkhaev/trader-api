import { ema } from "technicalindicators"
import { Candle } from "../../../types"

export async function movingAverageStrategy(candles1sec: Candle[]) {
  const closes = candles1sec.map((candle) => candle.close)

  const ema10 = ema({
    period: 10,
    values: closes,
  }).slice(-1)[0]

  const ema50 = ema({
    period: 50,
    values: closes,
  }).slice(-1)[0]

  const currentPrice = candles1sec[candles1sec.length - 1].close

  return {
    signal: ema10 > ema50 ? 1 : -1,
    indicators: [
      { name: "EMA 10", signal: ema10, data: currentPrice },
      { name: "EMA 50", signal: ema50, data: currentPrice },
    ],
  }
}
