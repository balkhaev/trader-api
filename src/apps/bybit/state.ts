import { Candle } from "../../types"
import { AllowedIntervals, Trade } from "./types"

// Хранилище минутных свечей по таймфреймам
const klines: Record<AllowedIntervals, Record<number, Candle>> = {
  "1": {},
  "3": {},
  "15": {},
  "30": {},
}

// Хранилище тиковых сделок
const symbolTrades: Record<string, Trade[]> = {}
const waitBuySumbols: string[] = []

export function addWaitBuySymbol(symbol: string) {
  waitBuySumbols.push(symbol)
}

export function rmWaitBuySymbol(symbol: string) {
  waitBuySumbols.splice(waitBuySumbols.indexOf(symbol), 1)
}

export function hasWaitBuySymbol(symbol: string) {
  return waitBuySumbols.findIndex((s) => s === symbol) !== -1
}

export function setTimeframeKlines(timeframe: AllowedIntervals, kline: Candle) {
  if (!kline.start) {
    throw new Error("kline.start is required")
  }

  klines[timeframe][kline.start] = kline
}

export function getTimeframeKlines(timeframe: AllowedIntervals): Candle[] {
  return Object.values(klines[timeframe])
}

export function addTrades(symbol: string, trades: Trade[]) {
  symbolTrades[symbol] = [...(symbolTrades[symbol] || []), ...trades]
}

export function getTrades(symbol: string): Trade[] {
  return symbolTrades[symbol] || []
}

export function generateOneSecondCandles(trades: Trade[]): Candle[] {
  if (trades.length === 0) {
    return []
  }

  // Сортируем сделки по времени
  trades.sort((a, b) => a.time - b.time)

  const startTime = trades[0].time
  const endTime = trades[trades.length - 1].time

  const candles: Candle[] = []
  let previousCandle: Candle | null = null

  let tradeIndex = 0

  for (let currentTime = startTime; currentTime <= endTime; currentTime++) {
    const tradesThisSecond: Trade[] = []

    while (
      tradeIndex < trades.length &&
      trades[tradeIndex].time === currentTime
    ) {
      tradesThisSecond.push(trades[tradeIndex])
      tradeIndex++
    }

    let candle: Candle | undefined

    if (tradesThisSecond.length > 0) {
      const prices = tradesThisSecond.map((t) => t.price)
      const volumes = tradesThisSecond.map((t) => t.volume)

      const open = prices[0]
      const close = prices[prices.length - 1]
      const high = Math.max(...prices)
      const low = Math.min(...prices)
      const volume = volumes.reduce((acc, v) => acc + v, 0)

      candle = {
        time: currentTime * 1000,
        open,
        high,
        low,
        close,
        volume,
      }
    } else {
      // Нет сделок в эту секунду
      if (previousCandle) {
        // Создаём свечу с нулевым объёмом и ценой равной close предыдущей свечи
        const lastClose: number = previousCandle.close

        candle = {
          time: currentTime * 1000,
          open: lastClose,
          high: lastClose,
          low: lastClose,
          close: lastClose,
          volume: 0,
        }
      } else {
        continue
      }
    }

    candles.push(candle)
    previousCandle = candle
  }

  return candles
}
