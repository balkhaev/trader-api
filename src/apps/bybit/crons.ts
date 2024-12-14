import { fetchCurrentPrice, fetchKline, fetchTradeHistory } from "./sdk/methods"
import { sell } from "./buysell"
import { sellLongSignal } from "./strategy/long"
import { differenceInMinutes, format } from "date-fns"
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
    const [candles1, candles3, candles15, candles30] = await Promise.all(
      CANDLES_TO_FETCH_FOR_SELL.map((interval) =>
        fetchKline({ symbol, interval })
      )
    )

    const sellSignal = buy.type === "short" ? sellShortSignal : sellLongSignal

    const { signal, indicators } = sellSignal(
      buy,
      currentPrice,
      candles1,
      candles3,
      candles15,
      candles30
    )

    if (differenceInMinutes(new Date(), buy.created_at) > 5) {
      return
    }

    if (signal === -1) {
      try {
        await sell(buy.coin)
      } catch (e) {
        console.log("error in sell", e)
        return
      }

      const { error: updateError } = await supabase
        .from("buys")
        .update({ selled: true })
        .eq("id", buy.id)

      if (updateError) {
        console.log("!UPDATE ERROR!", updateError)
      }

      const qty = parseFloat(buy.qty)
      const tradePrice = buy.price
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
