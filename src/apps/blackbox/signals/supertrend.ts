import { Candle } from "../../../types"
import { MetaSignal } from "../../bybit/signals"
import { supertrend } from "../indicators/supertrend"

export function getSupertrendSignal(
  lastPrice: number,
  initialArray: Candle[],
  period = 10,
  multiplier = 3
): MetaSignal {
  if (initialArray.length < period) {
    return {
      signal: 0,
      indicators: [
        {
          name: `Need more candles (period ${period})`,
          signal: initialArray.length,
        },
      ],
    }
  }

  const st = supertrend(initialArray, period, multiplier)
  const lastTrend = st[st.length - 1]

  // Логика пересечения: проверяем, пересекала ли цена супертренд снизу вверх
  let wasBelow = false // Флаг: была ли цена ниже супертренда
  let crossedUp = false // Флаг: произошло ли пересечение снизу вверх

  const positiveTrend = lastPrice > lastTrend
  const negativeTrend = lastPrice < lastTrend

  for (let i = 0; i < st.length - 1; i++) {
    const currentPrice = initialArray[i].close // Цена закрытия текущей свечи
    const currentSupertrend = st[i]

    if (currentPrice < currentSupertrend) {
      wasBelow = true // Цена была ниже супертренда
    }

    if (wasBelow && currentPrice > st[i + 1]) {
      crossedUp = true // Пересечение снизу вверх
      break
    }
  }

  const indicators = [
    {
      name: `Was below (${period}, ${multiplier})`,
      signal: wasBelow,
    },
    {
      name: `Crossed up (${period}, ${multiplier})`,
      signal: crossedUp,
    },
  ]

  return {
    signal: positiveTrend ? 1 : negativeTrend ? -1 : 0,
    indicators,
    newTrend: wasBelow || crossedUp,
  }
}
