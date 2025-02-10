import Queue from "bull"
import ccxt from "ccxt"
import { createClient } from "@supabase/supabase-js"
import { supabase } from "../../lib/supabase"

export interface AnalyzeFundingJobData {
  exchangeId: string
  symbol: string
}

// Создаём очередь для анализа funding rate
export const analyzeFundingQueue = new Queue<AnalyzeFundingJobData>(
  "funding-analyze",
  {
    redis: {
      port: 6379,
      host: process.env.REDIS_HOST || "127.0.0.1",
      password: process.env.REDIS_PASSWORD || undefined,
    },
  }
)

/**
 * Обработчик очереди:
 * 1. Для каждой задачи (валютная пара) запрашивается funding rate через ccxt.
 * 2. Оценивается ликвидность через ордербук.
 * 3. Полученный результат записывается в таблицу funding_rates в Supabase.
 */
analyzeFundingQueue.process(4, async (job) => {
  const { exchangeId, symbol } = job.data
  console.log(`Processing job: exchange ${exchangeId}, symbol ${symbol}`)

  // Получаем класс биржи через ccxt
  const exchangeClass = (ccxt as any)[exchangeId]
  if (!exchangeClass) {
    console.error(`Биржа ${exchangeId} не поддерживается ccxt.`)
    return
  }
  const exchange = new exchangeClass({ enableRateLimit: true })

  if (!exchange.has["fetchFundingRate"]) {
    console.log(`Биржа ${exchangeId} не поддерживает fetchFundingRate.`)
    return
  }

  try {
    // Получаем funding rate
    const result = await (exchange as any).fetchFundingRate(symbol)

    // Рассчитываем ликвидность по ордербуку (спред)
    let liquidityScore = 0
    try {
      const orderBook = await exchange.fetchOrderBook(symbol)
      const bestBid =
        orderBook.bids && orderBook.bids.length
          ? orderBook.bids[0][0]
          : undefined
      const bestAsk =
        orderBook.asks && orderBook.asks.length
          ? orderBook.asks[0][0]
          : undefined
      if (bestBid !== undefined && bestAsk !== undefined) {
        liquidityScore = bestAsk - bestBid
      }
    } catch (orderError) {
      console.warn(
        `Не удалось получить ордербук для ${exchangeId} ${symbol}:`,
        orderError
      )
    }

    // Собираем данные
    const fundingRateInfo = {
      exchangeId,
      symbol,
      fundingRate: result.fundingRate || result.rate || 0,
      liquidityScore,
      timestamp: result.timestamp || Date.now(),
    }

    const { data, error } = await supabase.from("funding_rates").insert([
      {
        exchange_id: fundingRateInfo.exchangeId,
        symbol: fundingRateInfo.symbol,
        funding_rate: fundingRateInfo.fundingRate,
        liquidity_score: fundingRateInfo.liquidityScore,
        timestamp: fundingRateInfo.timestamp,
      },
    ])

    if (error) {
      console.error(
        `Ошибка записи данных в Supabase для ${exchangeId} ${symbol}:`,
        error
      )
    } else {
      console.log(
        `Данные для ${exchangeId} ${symbol} успешно записаны в Supabase.`,
        data
      )
    }
  } catch (err) {
    console.error(`Ошибка обработки для ${exchangeId} ${symbol}:`, err)
    throw err
  }
})

/**
 * Функция добавляет задания в очередь для анализа funding rate всех валютных пар заданной биржи.
 * Эта функция не ждёт результатов выполнения заданий, а лишь заполняет очередь.
 *
 * @param exchangeId – идентификатор биржи (например, "binanceusdm")
 * @returns количество добавленных заданий
 */
export async function enqueueFundingRateJobsForExchange(
  exchangeId: string
): Promise<number> {
  try {
    // Проверяем поддержку биржи
    const exchangeClass = (ccxt as any)[exchangeId]
    if (!exchangeClass) {
      console.log(`Биржа ${exchangeId} не поддерживается ccxt.`)
      return 0
    }
    const exchange = new exchangeClass({ enableRateLimit: true })

    // Если биржа не поддерживает fetchFundingRate, ничего не делаем
    if (!exchange.has["fetchFundingRate"]) {
      console.log(`Биржа ${exchangeId} не поддерживает fetchFundingRate.`)
      return 0
    }

    // Загружаем все рынки и получаем список валютных пар
    await exchange.loadMarkets()
    const symbols: string[] = exchange.symbols
    console.log(
      `Найдено ${symbols.length} пар на бирже ${exchangeId}. Заполняем очередь...`
    )

    // Для каждой валютной пары добавляем задание в очередь
    for (const symbol of symbols) {
      const jobData: AnalyzeFundingJobData = { exchangeId, symbol }
      await analyzeFundingQueue.add(jobData)
    }
    return symbols.length
  } catch (error) {
    console.error(
      `Ошибка при заполнении очереди для биржи ${exchangeId}:`,
      error
    )
    return 0
  }
}

// Пример вызова: добавляем задания в очередь для биржи "binanceusdm"
enqueueFundingRateJobsForExchange("binanceusdm").then((count) => {
  console.log(`Добавлено ${count} заданий в очередь анализа funding rate.`)
})
