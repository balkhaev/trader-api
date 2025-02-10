import snakecaseKeys from "snakecase-keys"
import { supabase } from "../../lib/supabase"
import { buy } from "./buysell"
import { analyzeSymbolQueue } from "./queue"
import { fetchCurrentPrice, fetchTickers } from "./sdk/methods"
import { io } from "../../server"
import { addMinutes, differenceInMinutes } from "date-fns"
import { longPos, shortPos } from "./consts"

export async function getTrendTickers() {
  const tickers = await fetchTickers()

  const trending = tickers.filter((ticker) => {
    return (
      ticker.volume24h > 2_000_000 && // Объем торгов за 24 часа > 5 млн
      ticker.turnover24 > 1_000_000 && // Оборот за 24 часа > 1 млн
      Math.abs(ticker.change24h) > 0.02 && // Изменение цены более 2% за 24 часа
      ticker.symbol.endsWith(process.env.BASE_CURRENCY!) // Фильтрация по базовой валюте
    )
  })

  return {
    all: tickers,
    trending,
  }
}

export default async function analyzeBybit() {
  const tickers = await getTrendTickers()

  analyzeSymbolQueue.addBulk(
    tickers.trending.map((ticker) => ({
      data: ticker,
    }))
  )

  return { tickers }
}

analyzeSymbolQueue.on("completed", async (job) => {
  const { error, data } = await supabase
    .from("analysis")
    .insert(snakecaseKeys(job.returnvalue, { deep: false }))
    .select()
    .single()

  if (error) {
    console.error("in completed", error)
    return
  }

  const e0v1e =
    typeof data.e0v1e === "object" && !Array.isArray(data.e0v1e)
      ? data.e0v1e
      : null

  const long =
    typeof data.long === "object" && !Array.isArray(data.long)
      ? data.long
      : null

  const short =
    typeof data.short === "object" && !Array.isArray(data.short)
      ? data.short
      : null

  const isLongSignal = long?.signal === 1 // || e0v1e?.signal === 1
  const buyType = isLongSignal ? "long" : "short"
  const buyApprove = isLongSignal // || short?.signal === 1
  const symbol = job.returnvalue.symbol

  if (buyApprove && process.env.BUYS_ENABLED === "true") {
    const { data: lastBuy } = await supabase
      .from("buys")
      .select("created_at,selled")
      .order("created_at", { ascending: false })
      .eq("symbol", symbol)
      .single()

    if (lastBuy) {
      if (
        !lastBuy.selled ||
        differenceInMinutes(new Date(), +lastBuy.created_at) < 60
      ) {
        return
      }
    }

    const pos = isLongSignal ? longPos : shortPos
    const order = await buy(symbol, pos.buy)

    if (order) {
      const currentPrice = await fetchCurrentPrice(symbol)
      const waitFor = addMinutes(new Date(), isLongSignal ? 10 : 5).getTime()

      // const { error } = await supabase.from("buys").insert({
      //   price: currentPrice,
      //   symbol: symbol,
      //   order_id: order.orderId,
      //   qty: order.qty.toString(),
      //   indicators: job.returnvalue[buyType].indicators,
      //   type: e0v1e?.signal === 1 ? "e0v1e" : buyType,
      //   coin: symbol.slice(0, -4),
      //   wait_for: waitFor,
      //   take_profit: pos.takeProfit,
      //   stop_loss: pos.stopLoss,
      // })

      // if (error) {
      //   console.log("Error in saving buy", error)
      // }
    }
  }

  io.emit("job-count", await analyzeSymbolQueue.count())
})
