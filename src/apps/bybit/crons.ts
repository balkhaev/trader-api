import { fetchCurrentPrice, fetchKline, fetchPositions } from "./sdk/methods"
import { sell } from "./buysell"
import { sellSignal } from "./signals"
import { format } from "date-fns"
import { KlineIntervalV3 } from "bybit-api"
import { supabase } from "../../lib/supabase"

const CANDLES_TO_FETCH_FOR_SELL: KlineIntervalV3[] = ["1", "3", "15", "30"]

// export const analyzeBybitCron = new CronJob(
//   "*/3 * * * *",
//   async () => {
//     analyzeBybit()
//   },
//   null
// )

const checkSell = async () => {
  console.log("SELL CHECK", format(new Date(), "yyyy-MM-dd HH:mm:ss"))

  const positions = await fetchPositions()

  if (!positions || positions.length === 0) {
    return
  }

  for (const position of positions) {
    const currentPrice = await fetchCurrentPrice(position.symbol)
    const [candles1, candles3, candles15, candles30] = await Promise.all(
      CANDLES_TO_FETCH_FOR_SELL.map((interval) =>
        fetchKline({ symbol: position.symbol, interval })
      )
    )

    const { signal, indicators } = sellSignal(
      position,
      currentPrice,
      candles1,
      candles3,
      candles15,
      candles30
    )

    if (signal === -1) {
      try {
        await sell(position.symbol)
      } catch (e) {
        console.log("error in sell", e)
      }

      const { error } = await supabase.from("sells").insert({
        unrealised_pnl: position.unrealisedPnl,
        symbol: position.symbol,
        candles1,
        candles3,
        candles15,
        candles30,
        indicators: indicators,
      })

      if (error) {
        console.error("in sell cron", error)
      }
    }
  }
}

if (process.env.NODE_ENV === "production") {
  setInterval(checkSell, 15000)
}
