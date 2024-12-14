import { configDotenv } from "dotenv"

configDotenv({ path: ".env" })

import { getSupertrendSignal } from "./apps/blackbox/signals/supertrend"
import { createOrder, fetchKline } from "./apps/bybit/sdk/methods"
import { sell } from "./apps/bybit/buysell"
;(async () => {
  const order = await sell("ENSUSDT")

  console.log(order)
})()
