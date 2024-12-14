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
    (ticker) => ticker.volume24h > 1_000_000 && ticker.lastPrice > 0.05
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
  if (job.returnvalue.signal === 1) {
    buy(job.returnvalue.symbol)
  }

  const { error } = await supabase
    .from("analysis")
    .insert(snakecaseKeys(job.returnvalue, { deep: false }))

  if (error) {
    console.error(job, error)
    throw error
  }

  io.emit("job-count", await analyzeSymbolQueue.count())
})
