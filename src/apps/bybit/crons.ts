import {
  fetchBuyedCoins,
  fetchCurrentPrice,
  fetchKline,
  fetchTradeHistory,
} from "./sdk/methods"
import { sell } from "./buysell"
import { sellSignal } from "./strategy/long"
import { format } from "date-fns"
import { KlineIntervalV3 } from "bybit-api"
import { supabase } from "../../lib/supabase"
import { bybitRestClient } from "./sdk/clients"

const CANDLES_TO_FETCH_FOR_SELL: KlineIntervalV3[] = ["1", "3", "15", "30"]

export const checkPositionsSell = async () => {
  console.log("SELL CHECK", format(new Date(), "yyyy-MM-dd HH:mm:ss"))

  const buyedCoins = await fetchBuyedCoins()

  if (buyedCoins.length === 0) {
    return
  }

  console.log("CHECK", buyedCoins.length)

  for (const buyedCoin of buyedCoins) {
    const symbol = buyedCoin.coin + process.env.BASE_CURRENCY!
    const currentPrice = await fetchCurrentPrice(symbol)
    const trades = await fetchTradeHistory(symbol)
    const lastSellTrade = trades.reverse().find((t) => t.side === "Sell")
    const [candles1, candles3, candles15, candles30] = await Promise.all(
      CANDLES_TO_FETCH_FOR_SELL.map((interval) =>
        fetchKline({ symbol, interval })
      )
    )

    if (!lastSellTrade) {
      console.log("WHERES LAST TRADE?!", symbol, trades)
      return
    }

    const { signal, indicators } = sellSignal(
      lastSellTrade,
      currentPrice,
      candles1,
      candles3,
      candles15,
      candles30
    )

    console.log(buyedCoin.coin, indicators)

    if (signal === -1) {
      try {
        await sell(buyedCoin.coin)
      } catch (e) {
        console.log("error in sell", e)
      }

      const { error } = await supabase.from("sells").insert({
        unrealised_pnl: buyedCoin.cumRealisedPnl,
        symbol,
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

// export const analyzeBybitCron = new CronJob(
//   "*/3 * * * *",
//   async () => {
//     analyzeBybit()
//   },
//   null
// )
