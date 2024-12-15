import { fetchCurrentPrice, fetchKline, fetchTradeHistory } from "./sdk/methods"
import { sell } from "./buysell"
import { sellLongSignal } from "./strategy/long"
import { format, formatDistanceToNow, isFuture } from "date-fns"
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

const TRAILING_STOP = process.env.TRAILING_PROFIT === "true"
const TRAILING_STOP_POSITIVE = parseFloat(
  process.env.TRAILING_STOP_POSITIVE ?? "0.002"
)
const TRAILING_STOP_POSITIVE_OFFSET = parseFloat(
  process.env.TRAILING_STOP_POSITIVE_OFFSET ?? "0.05"
)

// Словарь, чтобы хранить состояние трейлинга для сделок
const trailingActivated: Map<number, boolean> = new Map()

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

    const pnl = parseFloat(buy.qty) * (currentPrice - buy.price)
    const currentProfitRatio = (currentPrice - buy.price) / buy.price // относительная прибыль

    const takeProfit =
      typeof buy.take_profit === "number" &&
      currentProfitRatio > buy.take_profit

    const stopLoss =
      typeof buy.stop_loss === "number" && currentProfitRatio < buy.stop_loss

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
      currentProfit: pnl,
      candles1,
      candles3,
      candles5,
      candles15,
      candles30,
      candles240,
    })

    const pos = {
      sell: 1,
    }

    // Логика трейлинга
    // Если трейлинг включён и сделка ещё не продана
    if (!takeProfit && !stopLoss && TRAILING_STOP && signal !== -1) {
      // Проверяем достигли ли мы уровня оффсета
      const alreadyActivated = trailingActivated.get(buy.id) || false

      // Если ещё не активировано трейление и достигли оффсета прибыли
      if (
        !alreadyActivated &&
        currentProfitRatio >= TRAILING_STOP_POSITIVE_OFFSET
      ) {
        trailingActivated.set(buy.id, true)
        console.log(`Trailing activated for trade ${buy.id}`)
      }

      // Если трейлинг активирован
      if (trailingActivated.get(buy.id)) {
        // Если нужно трейлить только после достижения оффсета, он уже достигнут
        // Проверяем, не упала ли прибыль ниже TRAILING_STOP_POSITIVE
        if (currentProfitRatio < TRAILING_STOP_POSITIVE) {
          console.log(`Exiting trade ${buy.id} by trailing stop`)
          pos.sell = TRAILING_STOP_POSITIVE_OFFSET
          signal = -1
          indicators.push({
            name: "Trailing Stop Exit",
            signal: boolToSignal(true),
            data: { currentProfitRatio },
          })
        } else {
          // Прибыль всё ещё выше TRAILING_STOP_POSITIVE, держим сделку
          indicators.push({
            name: "Trailing Stop Active",
            signal: boolToSignal(true),
            data: { currentProfitRatio },
          })
        }
      }
    }

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
        ...indicators,
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
        await sell(buy.coin, pos.sell)
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
        console.error("in sell cron", error)
      }

      // Если сделка закрывается, удаляем её из trailingActivated, если она была там
      if (trailingActivated.has(buy.id)) {
        trailingActivated.delete(buy.id)
      }
    }
  }
}
