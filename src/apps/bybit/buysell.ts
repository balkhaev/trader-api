import {
  createOrder,
  fetchBuyedCoins,
  fetchCurrentPrice,
  fetchInstrumentInfo,
} from "./sdk/methods"
import { io } from "../../server"
import {
  addWaitBuySymbol,
  countWaitBuySymbols,
  hasWaitBuySymbol,
  rmWaitBuySymbol,
} from "./state"
import { LIMIT_BUYS, USDT_QTY } from "./consts"

export const buy = async (symbol: string) => {
  if (hasWaitBuySymbol(symbol)) return

  const coin = symbol.replace(process.env.BASE_CURRENCY!, "")

  addWaitBuySymbol(symbol)

  const buyedCoins = await fetchBuyedCoins()
  const symbolPosition = buyedCoins.find((p) => p.coin === coin)

  if (symbolPosition) {
    rmWaitBuySymbol(symbol)
    return
  }

  if (countWaitBuySymbols() + buyedCoins.length >= LIMIT_BUYS) {
    rmWaitBuySymbol(symbol)
    return
  }

  const instrument = await fetchInstrumentInfo(symbol)
  const currentPrice = await fetchCurrentPrice(symbol)
  const qty = (USDT_QTY / currentPrice).toFixed(2)

  if (instrument.lotSizeFilter.minOrderQty > qty) {
    console.log("too small qty", { instrument, qty, currentPrice })
    rmWaitBuySymbol(symbol)
    return null
  }

  console.log(symbol, qty, "buying for", currentPrice)

  try {
    const order = await createOrder({
      symbol,
      side: "Buy",
      orderType: "Market",
      qty,
      marketUnit: "baseCoin",
    })

    rmWaitBuySymbol(symbol)
    io.emit("buyed")

    return {
      orderId: order.orderId,
      qty,
    }
  } catch (e) {
    console.log(e)
    rmWaitBuySymbol(symbol)

    return null
  }
}

export const sell = async (coin: string) => {
  console.log("try sell", coin)

  const symbol = coin + process.env.BASE_CURRENCY
  const buyedCoins = await fetchBuyedCoins()
  const buyedCoin = buyedCoins.find((p) => p.coin === coin)

  if (!buyedCoin) {
    throw new Error("Нет открытой позиции для продажи.")
  }

  const qty = buyedCoin.availableToWithdraw // Текущее количество монет

  const order = await createOrder({
    symbol,
    side: "Sell",
    orderType: "Market",
    qty,
    marketUnit: "baseCoin",
  })

  console.log(symbol, "selled")

  io.emit("selled")

  return order
}
