import { CronJob } from "cron"
import analyzeBybit from "./analyze"
import { fetchCurrentPrice, fetchKline, fetchPositions } from "./sdk/methods"
import { sell } from "./buysell"
import { sellSignal } from "./signals"
import { CANDLES_TO_FETCH_FOR_SELL } from "./consts"
import { format } from "date-fns"

export const analyzeBybitCron = new CronJob(
  "*/2 * * * *",
  async () => {
    analyzeBybit()
  },
  null
)

export const sellCron = new CronJob(
  "* * * * *",
  async () => {
    console.log("=======SELL CHECK=========")
    console.log(format(new Date(), "yyyy-MM-dd HH:mm:ss"))

    const positions = await fetchPositions()

    positions?.forEach(async (position) => {
      const currentPrice = await fetchCurrentPrice(position.symbol)
      const [candles3, candles15] = await Promise.all(
        CANDLES_TO_FETCH_FOR_SELL.map((interval) =>
          fetchKline({ symbol: position.symbol, interval })
        )
      )

      const { signal, indicators } = sellSignal(
        position,
        currentPrice,
        candles3,
        candles15
      )

      console.log(position.symbol, position.curRealisedPnl, indicators)

      if (signal === -1) {
        try {
          await sell(position.symbol)
        } catch (e) {
          console.log("error in sell", e)
        }
      }
    })
  },
  null,
  true
)
