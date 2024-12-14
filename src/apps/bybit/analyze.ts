import snakecaseKeys from "snakecase-keys"
import { supabase } from "../../lib/supabase"
import { buy } from "./buysell"
import { analyzeSymbolQueue } from "./queue"
import { fetchTickers } from "./sdk/methods"
import { io } from "../../server"
import "./crons"

export async function getTrendTickers() {
  const tickers = await fetchTickers()

  const trending = tickers.filter(
    (ticker) =>
      ticker.lastPrice > 0.2 &&
      ticker.symbol.endsWith(process.env.BASE_CURRENCY!)
  )

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
  const { error } = await supabase
    .from("analysis")
    .insert(snakecaseKeys(job.returnvalue, { deep: false }))

  if (error) {
    console.error(job, error)
    throw error
  }

  if (job.returnvalue.signal === 1) {
    const order = await buy(job.returnvalue.symbol)

    if (order) {
      const { error } = await supabase.from("buys").insert({
        symbol: job.returnvalue.symbol,
        order_id: order.orderId,
        qty: order.qty,
        indicators: job.returnvalue.indicators,
        new_trend: job.returnvalue.newTrend,
      })

      if (error) {
        console.log("Error in saving buy", error)
      }
    }
  }

  io.emit("job-count", await analyzeSymbolQueue.count())
})
