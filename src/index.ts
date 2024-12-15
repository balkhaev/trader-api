import dotenv from "dotenv"

dotenv.config()

import { server, io } from "./server"
import { checkPositionsSell } from "./apps/bybit/crons"
import { analyzeSymbolQueue } from "./apps/bybit/queue"
import analyzeBybit from "./apps/bybit/analyze"
import { LIMIT_BUYS, longPos, shortPos } from "./apps/bybit/consts"

const PORT = process.env.PORT || 8000

async function main() {
  server.listen(PORT, () => {
    console.log("Сервер запущен на порту", PORT)
    console.log("NODE_ENV:", process.env.NODE_ENV)
    console.log("BASE_CURRENCY:", process.env.BASE_CURRENCY)
    console.log("REDIS_HOST:", process.env.REDIS_HOST)
    console.log({ longPos, shortPos, LIMIT_BUYS })
  })

  /**
   * Покупаем
   */
  if (process.env.BUYS_ENABLED === "true") {
    analyzeSymbolQueue.on("drained", async () => {
      if ((await analyzeSymbolQueue.count()) === 0) {
        console.log("NEW ANALYZE")
        analyzeBybit()
      }
    })

    if ((await analyzeSymbolQueue.count()) === 0) {
      analyzeBybit()
    }
  }

  /**
   * Продаем
   */
  if (process.env.SELLS_ENABLED === "true") {
    setInterval(checkPositionsSell, 15000)
  }
}

main().catch((err) => {
  io.emit("exit", JSON.stringify(err))
  console.error(err)
  process.exit(1)
})
