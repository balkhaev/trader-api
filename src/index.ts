import dotenv from "dotenv"

dotenv.config()

import { server, io } from "./server"
import { checkPositionsSell } from "./apps/bybit/crons"
import { analyzeSymbolQueue } from "./apps/bybit/queue"
import analyzeBybit from "./apps/bybit/analyze"

const PORT = process.env.PORT || 8000

async function main() {
  server.listen(PORT, () => {
    console.log("Сервер запущен на порту", PORT)
    console.log("NODE_ENV:", process.env.NODE_ENV)
  })

  /**
   * Покупаем только на локальном деве
   */
  if (process.env.NODE_ENV === "development") {
    analyzeSymbolQueue.on("drained", async () => {
      if ((await analyzeSymbolQueue.count()) === 0) {
        analyzeBybit()
      }
    })

    if ((await analyzeSymbolQueue.count()) === 0) {
      analyzeBybit()
    }
  }

  /**
   * Продаем на проде
   */
  if (process.env.NODE_ENV === "production") {
    setInterval(checkPositionsSell, 15000)

    console.log("prod check sell")
  }
}

main().catch((err) => {
  io.emit("exit", JSON.stringify(err))
  console.error(err)
  process.exit(1)
})
