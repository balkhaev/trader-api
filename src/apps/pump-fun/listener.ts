import WebSocket from "ws"
import EventEmitter from "node:events"
import { TransactionWithTs } from "./types"
import { SECONDS_TO_LISTEN_COIN } from "."
import { MIN_MARKET_CAP_LIMIT_IN_SOL, StrategyOpts, rateTx } from "./strategy"
import {
  addPrevTx,
  coinHaveHistory,
  isActive,
  thisMintIsActive,
  txToMsTx,
} from "./state"
import { rateTrader, traderEvents } from "./trader"

export const pumpFunEvents = new EventEmitter()

pumpFunEvents.setMaxListeners(1000000)

export function listenPumpFun(opts?: StrategyOpts) {
  const newTokenWs = new WebSocket("wss://pumpportal.fun/api/data")
  const tradesWs = new WebSocket("wss://pumpportal.fun/api/data")

  newTokenWs.setMaxListeners(1000000)
  tradesWs.setMaxListeners(1000000)

  newTokenWs.on("open", function open() {
    newTokenWs.send(
      JSON.stringify({
        method: "subscribeNewToken",
      })
    )
  })

  newTokenWs.on("message", function message(data) {
    let newCoin = JSON.parse(data.toString())

    if (newCoin.message) return

    newCoin.timestamp = new Date().getTime()

    const unsubscribeTokenTrade = () => {
      tradesWs.send(
        JSON.stringify({
          method: "unsubscribeTokenTrade",
          keys: [newCoin.mint],
        })
      )

      clearTimeout(timeoutId)
    }

    const timeoutId = setTimeout(
      unsubscribeTokenTrade,
      SECONDS_TO_LISTEN_COIN * 1000
    )

    tradesWs.send(
      JSON.stringify({
        method: "subscribeTokenTrade",
        keys: [newCoin.mint],
      })
    )

    traderEvents.on("buy", (coin, tx) => {
      if (coin.mint !== newCoin.mint) return
      console.log("!!!!!!!!!!! buyed", coin.mint)
      // pumpFunEvents.emit("buy", { coin, tx })
      clearTimeout(timeoutId)
    })

    traderEvents.on("sell", (coin, tx, ratio = 1) => {
      if (coin.mint !== newCoin.mint) return
      console.log("!!!!!!!!!!! selling", coin.mint, ratio)
      unsubscribeTokenTrade()
      // pumpFunEvents.emit("sell", { coin, tx, ratio })
    })

    tradesWs.on("message", async function message(data) {
      const msg = JSON.parse(data.toString())

      if (msg.message || msg.mint !== newCoin.mint) return
      if (isActive() && !thisMintIsActive(msg.mint)) return

      const tx: TransactionWithTs = txToMsTx(msg)

      if (
        !coinHaveHistory(tx.mint) &&
        MIN_MARKET_CAP_LIMIT_IN_SOL > tx.marketCapSol
      ) {
        pumpFunEvents.emit("new-token", newCoin)
      }

      rateTrader(tx, newCoin, opts)
      addPrevTx(tx.mint, tx)

      pumpFunEvents.emit("tx", { coin: newCoin, tx })
    })
  })

  return {
    destroy() {
      pumpFunEvents.removeAllListeners()
      newTokenWs.close()
      tradesWs.close()
    },
  }
}
