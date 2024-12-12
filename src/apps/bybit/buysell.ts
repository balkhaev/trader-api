import { createOrder, fetchCurrentPrice, fetchPositions } from "./sdk/methods"
import { io } from "../../server"
import { addWaitBuySymbol, hasWaitBuySymbol, rmWaitBuySymbol } from "./state"

export const buy = async (symbol: string) => {
  if (hasWaitBuySymbol(symbol)) return

  const positions = await fetchPositions(symbol)

  if (positions.length > 0) {
    return
  }

  addWaitBuySymbol(symbol)

  console.log(symbol, "buying...")

  const currentPrice = await fetchCurrentPrice(symbol)
  const qty = (5 / currentPrice).toFixed(1)

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

  if (!hasWaitBuySymbol(symbol)) return

  const [position] = await fetchPositions(symbol)

  if (!position || position.size === "0") {
    throw new Error("Нет открытой позиции для продажи.")
  }

  const qty = position.size // Текущее количество монет

  console.log(symbol, "selled", position)

  const order = await createOrder({
    symbol,
    side: "Sell",
    orderType: "Market",
    qty,
    marketUnit: "quoteCoin",
  })

  io.emit("selled")

  return order
}
