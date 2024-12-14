import {
  createOrder,
  fetchCurrentPrice,
  fetchInstrumentInfo,
  fetchPositions,
} from "./sdk/methods"
import { io } from "../../server"
import {
  addWaitBuySymbol,
  countWaitBuySymbols,
  hasWaitBuySymbol,
  rmWaitBuySymbol,
} from "./state"
import { LIMIT_BUYS } from "./consts"

const USDT_QTY = 3

export const buy = async (symbol: string) => {
  if (hasWaitBuySymbol(symbol)) return

  addWaitBuySymbol(symbol)

  const positions = await fetchPositions()
  const symbolPosition = positions.find((p) => p.symbol === symbol)
  const sizedPositions = positions.filter((p) => parseFloat(p.size) > 0)

  if (symbolPosition && parseFloat(symbolPosition.size) > 0) {
    rmWaitBuySymbol(symbol)
    return
  }

  if (countWaitBuySymbols() + sizedPositions.length >= LIMIT_BUYS) {
    rmWaitBuySymbol(symbol)
    return
  }

  console.log(symbol, "buying...")

  const currentPrice = await fetchCurrentPrice(symbol)
  const qty = (USDT_QTY / currentPrice).toFixed(2)

  try {
    const order = await createOrder({
      symbol,
      side: "Buy",
      orderType: "Market",
      qty,
    })

    rmWaitBuySymbol(symbol)
    io.emit("buyed")

    return order
  } catch (e) {
    console.log(e)
    rmWaitBuySymbol(symbol)

    return null
  }
}

export const sell = async (symbol: string) => {
  console.log("try sell", symbol)

  const [position] = await fetchPositions(symbol)

  if (!position || position.size === "0") {
    throw new Error("Нет открытой позиции для продажи.")
  }

  const qty = position.size // Текущее количество монет

  const order = await createOrder({
    symbol,
    side: "Sell",
    orderType: "Market",
    qty,
    marketUnit: "quoteCoin",
  })

  console.log(symbol, "selled")

  io.emit("selled")

  return order
}
