import ccxt, { Exchange } from "ccxt"

/**
 * Функция hedgeTrade объединяет сделки:
 * 1. Открытие фьючерсной сделки на бирже (например, Binance USDM).
 * 2. Хеджирование на спотовом рынке:
 *    - Если futuresSide === 'buy' (лонг фьючерсов) → на споте открывается шорт через маржинальную торговлю.
 *    - Если futuresSide === 'sell' (шорт фьючерсов) → на споте открывается обычный лонг.
 *
 * @param futuresExchangeId - идентификатор биржи для фьючерсов (например, 'binanceusdm')
 * @param symbol - торговая пара (например, 'BTC/USDT')
 * @param amount - объём сделки
 * @param futuresSide - сторона сделки на фьючерсном рынке ('buy' или 'sell')
 */
export async function hedgeTrade(
  futuresExchangeId: string,
  symbol: string,
  amount: number,
  futuresSide: "buy" | "sell"
): Promise<any> {
  // Определяем сторону хеджирования – противоположную стороне фьючерсной сделки
  const hedgeSide: "buy" | "sell" = futuresSide === "buy" ? "sell" : "buy"

  // В данном примере поддерживается только Binance USDM для фьючерсной торговли.
  if (futuresExchangeId !== "binanceusdm") {
    throw new Error(
      `Поддерживается только Binance USDM для фьючерсной торговли в данном примере.`
    )
  }

  // Создаём экземпляр биржи для фьючерсной торговли (Binance USDM)
  const futuresExchange = new ccxt.binanceusdm({
    apiKey: process.env.BINANCE_USDM_API_KEY || "YOUR_BINANCE_USDM_API_KEY",
    secret: process.env.BINANCE_USDM_SECRET || "YOUR_BINANCE_USDM_SECRET",
    enableRateLimit: true,
  })

  // 1. Открываем рыночный ордер на фьючерсном рынке
  const futuresOrder = await futuresExchange.createMarketOrder(
    symbol,
    futuresSide,
    amount
  )
  console.log("Futures order:", futuresOrder)

  // 2. Хеджирование на спотовом рынке
  // Определяем базовый актив (для BTC/USDT базовый актив – 'BTC')
  const baseAsset = symbol.split("/")[0]

  // Для спотовой торговли используем Binance. При необходимости (если hedgeSide === 'sell')
  // выставляем defaultType в 'margin', чтобы использовать маржинальные функции.
  let spotExchange: Exchange
  if (hedgeSide === "sell") {
    // Для входа в шорт на споте через маржинальную торговлю
    spotExchange = new ccxt.binance({
      apiKey: process.env.BINANCE_SPOT_API_KEY || "YOUR_BINANCE_SPOT_API_KEY",
      secret: process.env.BINANCE_SPOT_SECRET || "YOUR_BINANCE_SPOT_SECRET",
      enableRateLimit: true,
      options: { defaultType: "margin" },
    })
  } else {
    // Для обычной покупки на споте
    spotExchange = new ccxt.binance({
      apiKey: process.env.BINANCE_SPOT_API_KEY || "YOUR_BINANCE_SPOT_API_KEY",
      secret: process.env.BINANCE_SPOT_SECRET || "YOUR_BINANCE_SPOT_SECRET",
      enableRateLimit: true,
      options: { defaultType: "spot" },
    })
  }

  let loanResponse: any = null
  if (hedgeSide === "sell") {
    // Для шорта на споте необходимо занять (заимствовать) базовый актив
    const loanParams = {
      asset: baseAsset,
      amount: amount.toString(), // сумма займа в виде строки
    }

    // Binance-метод для займа через маржинальную торговлю (sapiPostMarginLoan).
    // Обратите внимание: данный метод является биржевым (не унифицированным) и может меняться.
    loanResponse = await (spotExchange as any).sapiPostMarginLoan(loanParams)
    console.log("Loan response:", loanResponse)
  }

  // Размещаем рыночный ордер на спотовом рынке для хеджирования
  const hedgingOrder = await spotExchange.createMarketOrder(
    symbol,
    hedgeSide,
    amount
  )
  console.log("Hedging order:", hedgingOrder)

  return {
    futuresOrder,
    hedgingOrder,
    loanResponse,
  }
}
