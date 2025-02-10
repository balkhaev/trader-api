import ccxt from "ccxt"

export interface FundingRateInfo {
  exchangeId: string
  symbol: string
  fundingRate: number
  liquidityScore: number
  timestamp: number
}

/**
 * Получаем funding rate для всех валютных пар на бирже.
 * @param exchangeId – идентификатор биржи (например, "binance")
 */
export async function fetchAllFundingRatesFromExchange(
  exchangeId: string
): Promise<FundingRateInfo[]> {
  const fundingRates: FundingRateInfo[] = []
  try {
    // Проверяем, поддерживается ли биржа ccxt
    const exchangeClass = (ccxt as any)[exchangeId]
    if (!exchangeClass) {
      console.log(`Биржа ${exchangeId} не поддерживается ccxt.`)
      return fundingRates
    }
    // Создаём экземпляр биржи с включённым rateLimit
    const exchange = new exchangeClass({ enableRateLimit: true })

    // Проверяем, поддерживает ли биржа метод fetchFundingRate
    if (!exchange.has["fetchFundingRate"]) {
      console.log(`Биржа ${exchangeId} не поддерживает метод fetchFundingRate.`)
      return fundingRates
    }

    // Загружаем все рынки (валютные пары)
    await exchange.loadMarkets()
    const symbols: string[] = exchange.symbols

    // Перебираем все валютные пары
    for (const symbol of symbols) {
      try {
        // Пытаемся получить funding rate для пары
        const result = await (exchange as any).fetchFundingRate(symbol)

        // Запрашиваем ордербук для оценки ликвидности
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

        // Сохраняем информацию о funding rate
        fundingRates.push({
          exchangeId,
          symbol,
          fundingRate: result.fundingRate || result.rate || 0,
          liquidityScore,
          timestamp: result.timestamp || Date.now(),
        })
      } catch (err) {
        // Если для конкретной пары получить funding rate не удалось – пропускаем её
        // console.error(`Ошибка для ${exchangeId} ${symbol}:`, err);
      }
    }
  } catch (error) {
    console.error(`Ошибка при обработке биржи ${exchangeId}:`, error)
  }
  return fundingRates
}

/**
 * Получаем funding rate для всех валютных пар на указанных биржах и выбираем лучшую возможность.
 */
export async function fetchFundingRates(exchanges: string) {
  let allFundingRates: FundingRateInfo[] = []

  // Проходим по всем биржам и собираем данные
  for (const exchangeId of exchanges) {
    const rates = await fetchAllFundingRatesFromExchange(exchangeId)
    allFundingRates = allFundingRates.concat(rates)
  }

  // Опционально: фильтрация по ликвидности (например, если спред (liquidityScore) менее 50)
  const liquidityThreshold = 50
  const filtered = allFundingRates.filter(
    (info) => info.liquidityScore < liquidityThreshold
  )

  // Выбираем лучшую возможность – биржу и пару с максимальным по модулю funding rate
  let bestOpportunity: FundingRateInfo | null = null
  if (filtered.length > 0) {
    bestOpportunity = filtered.reduce((prev, curr) =>
      Math.abs(curr.fundingRate) > Math.abs(prev.fundingRate) ? curr : prev
    )
  }

  return {
    allFundingRates,
    filtered,
    bestOpportunity,
  }
}
