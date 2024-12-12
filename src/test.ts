import { configDotenv } from "dotenv"

configDotenv({ path: ".env" })

import { getSupertrendSignal } from "./apps/blackbox/signals/supertrend"
import { createOrder, fetchKline } from "./apps/bybit/sdk/methods"
;(async () => {
  const order = await createOrder({
    symbol: "ZKJUSDT",
    side: "Buy",
    orderType: "Market",
    qty: "2.5",
    marketUnit: "quoteCoin",
  })

  console.log(order)
})()
