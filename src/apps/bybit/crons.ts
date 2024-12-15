import { fetchCurrentPrice, fetchKline, fetchTradeHistory } from "./sdk/methods"
import { sell } from "./buysell"
import { sellLongSignal } from "./strategy/long"
import {
  differenceInMinutes,
  format,
  formatDistanceToNow,
  isFuture,
} from "date-fns"
import { KlineIntervalV3 } from "bybit-api"
import { supabase } from "../../lib/supabase"
import { sellShortSignal } from "./strategy/short"
import { boolToSignal } from "./utils"
import { sellEovieSignal } from "./strategy/e0v1e"

const CANDLES_TO_FETCH_FOR_SELL: KlineIntervalV3[] = [
  "1",
  "3",
  "5",
  "15",
  "30",
  "240",
]

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

    console.log("=======", symbol, "=========")

    const currentPrice = await fetchCurrentPrice(symbol)
    const [candles1, candles3, candles5, candles15, candles30, candles240] =
      await Promise.all(
        CANDLES_TO_FETCH_FOR_SELL.map((interval) =>
          fetchKline({ symbol, interval })
        )
      )
    const isLong = buy.type === "long"
    const isE0v1e = buy.type === "e0v1e"

    const sellSignal = isLong
      ? sellLongSignal
      : isE0v1e
      ? sellEovieSignal
      : sellShortSignal

    let { signal, indicators } = sellSignal({
      buy,
      currentPrice,
      candles1,
      candles3,
      candles5,
      candles15,
      candles30,
      candles240,
    })

    const pnl = parseFloat(buy.qty) * (currentPrice - buy.price)
    const takeProfit =
      typeof buy.take_profit === "number" && pnl > buy.take_profit
    const stopLoss = typeof buy.stop_loss === "number" && pnl < buy.stop_loss

    if (takeProfit || stopLoss) {
      indicators = [
        {
          name: "Stop loss",
          signal: boolToSignal(stopLoss ?? false),
          data: pnl,
        },
        {
          name: "Take profit",
          signal: boolToSignal(takeProfit ?? false),
          data: pnl,
        },
      ]
      signal = -1
    }

    if (buy.wait_for && isFuture(buy.wait_for)) {
      indicators = [
        { name: "Wait", signal: 0, data: formatDistanceToNow(buy.wait_for) },
      ]
      signal = 0
    }

    console.log({ takeProfit, stopLoss })
    console.log(indicators)

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
