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
import { LIMIT_BUYS } from "./consts"
import { supabase } from "../../lib/supabase"

export const buy = async (symbol: string, usdt: number) => {
  if (hasWaitBuySymbol(symbol)) return

  const coin = symbol.slice(0, -process.env.BASE_CURRENCY!.length)

  addWaitBuySymbol(symbol)

  const { data: buyedCoins } = await supabase
    .from("buys")
    .select()
    .eq("selled", false)
  const symbolPosition = buyedCoins?.find((p) => p.coin === coin)

  if (symbolPosition) {
    rmWaitBuySymbol(symbol)
    return
  }

  const buyedCount = buyedCoins?.length ?? 0
  const countInWait = countWaitBuySymbols() - 1

  if (countInWait + buyedCount >= LIMIT_BUYS) {
    rmWaitBuySymbol(symbol)
    return
  }

  const instrument = await fetchInstrumentInfo(symbol)
  const currentPrice = await fetchCurrentPrice(symbol)
  const basePrecision = instrument.lotSizeFilter.basePrecision.split(".")[1]
  const precision = basePrecision ? basePrecision.length : 0
  const factor = Math.pow(10, precision)
  const qty = Math.floor((usdt / currentPrice) * factor) / factor

  if (parseFloat(instrument.lotSizeFilter.minOrderQty) > qty) {
    rmWaitBuySymbol(symbol)
    return null
  }

  console.log(symbol, qty, "buying for", currentPrice)

  try {
    const order = await createOrder({
      symbol,
      side: "Buy",
      orderType: "Market",
      qty: qty.toString(),
      marketUnit: "baseCoin",
    })

    io.emit("buyed")

    return {
      orderId: order.orderId,
      qty,
    }
  } catch (e) {
    console.log(instrument, e)

    return null
  } finally {
    rmWaitBuySymbol(symbol)
  }
}

export const sell = async (coin: string, percent = 100) => {
  console.log("try sell", coin)

  const symbol = coin + process.env.BASE_CURRENCY
  const { data: buy } = await supabase
    .from("buys")
    .select()
    .eq("coin", coin)
    .eq("selled", false)
    .limit(1)
    .single()

  const buyedCoins = await fetchBuyedCoins()
  const buyedCoin = buyedCoins.find((p) => p.coin === coin)

  if (!buy || !buyedCoin) {
    throw new Error("Нет открытой позиции для продажи.")
  }

  const instrument = await fetchInstrumentInfo(symbol)
  const basePrecision = instrument.lotSizeFilter.basePrecision.split(".")[1]
  const precision = basePrecision ? basePrecision.length : 0

  const qty = parseFloat(buyedCoin.walletBalance) * (percent / 100)
  const factor = Math.pow(10, precision)
  const toSell = Math.floor(qty * factor) / factor

  console.log(symbol, "selling", toSell, instrument.lotSizeFilter.basePrecision)

  const order = await createOrder({
    symbol,
    side: "Sell",
    orderType: "Market",
    qty: toSell.toString(),
    marketUnit: "baseCoin",
  })

  console.log(symbol, "selled")

  io.emit("selled")

  return order
}
