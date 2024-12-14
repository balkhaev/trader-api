import { fetchCurrentPrice, fetchKline, fetchTradeHistory } from "./sdk/methods"
import { sell } from "./buysell"
import { sellLongSignal } from "./strategy/long"
import { format } from "date-fns"
import { KlineIntervalV3 } from "bybit-api"
import { supabase } from "../../lib/supabase"
import { sellShortSignal } from "./strategy/short"

const CANDLES_TO_FETCH_FOR_SELL: KlineIntervalV3[] = ["1", "3", "15", "30"]

export const checkPositionsSell = async () => {
  console.log("SELL CHECK", format(new Date(), "yyyy-MM-dd HH:mm:ss"))

  const { data: buys } = await supabase
    .from("buys")
    .select()
    .eq("selled", false)

  if (!buys || buys?.length === 0) {
    console.log("skipped", buys?.length)
    return
  }

  console.log("CHECK", buys?.length)

  for (const buy of buys) {
    const symbol = buy.symbol
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

    const sellSignal = buy.type === "short" ? sellShortSignal : sellLongSignal

    const { signal, indicators } = sellSignal(
      lastSellTrade,
      currentPrice,
      candles1,
      candles3,
      candles15,
      candles30
    )

    console.log(symbol, indicators)

    if (signal === -1) {
      try {
        await sell(buy.coin)
      } catch (e) {
        console.log("error in sell", e)
        return
      }

      const qty = parseFloat(lastSellTrade.orderQty)
      const tradePrice = parseFloat(lastSellTrade.orderPrice)
      const pnl = qty * (currentPrice - tradePrice)

      const { error } = await supabase.from("sells").insert({
        pnl,
        symbol,
        candles1,
        candles3,
        candles15,
        candles30,
        indicators,
      })

      if (error) {
        console.error("in long sell cron", error)
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
