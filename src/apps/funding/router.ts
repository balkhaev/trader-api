import { supabase } from "../../lib/supabase"

import express from "express"
import { fetchFundingRates } from "./lib/fundingRates"
import { hedgeTrade } from "./lib/hedge"
import ccxt from "ccxt"

const router = express.Router()

/**
 * GET /exchanges
 * Отправляет список доступных бирж (по умолчанию - Binance, Binance Spot, Binance Futures).
 */
router.post("/funding/scan", async (req, res) => {
  res.json(ccxt.exchanges)
})

/**
 * POST /scan
 * Сканирует заданные биржи на предмет их funding rate и ликвидности.
 * Принимает параметр запроса:
 *    exchanges – массив идентификаторов бирж (ccxt.exchanges).
 */
router.post("/funding/scan", async (req, res) => {
  const { exchanges = ["binanceusdm"] } = req.body

  const result = await fetchFundingRates(exchanges)

  res.json(result)
})

/**
 * POST /trade
 * Запускает торговую операцию:
 * 1. На бирже с выгодным funding rate открывается фьючерсная позиция.
 * 2. На спотовом рынке (например, Binance Spot) открывается позиция для хеджирования.
 *
 * Тело запроса должно содержать:
 *   {
 *     "symbol": "BTC/USDT",
 *     "amount": 0.001,
 *     "exchange": "binanceusdm",
 *     "futuresSide": "buy"
 *   }
 */
router.post("/funding/trade", async (req, res) => {
  const { exchange, symbol, amount, futuresSide } = req.body

  if (!exchange || !symbol || !amount || !futuresSide) {
    res.status(400).json({
      error: "Необходимо указать exchange, symbol, amount и futuresSide",
    })
    return
  }

  try {
    const result = await hedgeTrade(exchange, symbol, amount, futuresSide)
    res.json(result)
  } catch (error) {
    console.error("Ошибка в хеджировании:", error)
    res.status(500).json({ error: "Ошибка в хеджировании", details: error })
  }
})

export default router
