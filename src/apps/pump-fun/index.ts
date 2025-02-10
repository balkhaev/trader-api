import { DEVNET_POOL, QUICKNODE_POLL } from "../../lib/solana"
import { io } from "../../server"
import { handleBuy, handleSell } from "./handlers"
import { listenPumpFun, pumpFunEvents } from "./listener"
import { clearState, getBuyedTx, isRunning, setCoinCreatingTime } from "./state"
import { StrategyOpts } from "./strategy"
import { CreateTransaction, Transaction, TransactionWithTs } from "./types"

const blacklist = ["on1yUpq8wmKxFoW1Arnu7G4xwm6T9yJ8dHwyHDfkiKS"]
const blacklistedMints: string[] = []

export const SECONDS_TO_LISTEN_COIN = 7200 // 2h
export const BUY_AMOUNT_IN_SOL = 0.3

export async function listenMoneyEvents(opts?: StrategyOpts) {
  const pool = opts?.mode === "test" ? DEVNET_POOL : QUICKNODE_POLL

  console.log(`Started with pool - ${pool}`)

  const { destroy } = listenPumpFun(opts)

  const totalDestroy = () => {
    console.log("TOTAL DESTROY")
    destroy()
    clearState()
  }

  if (isRunning()) clearState()

  pumpFunEvents.on("buy", async (data: any) => {
    try {
      console.log(
        "\x1b[32m",
        "buyed",
        data.coin.mint,
        new Date().toLocaleTimeString(),
        data.tx.marketCapSol.toFixed(2),
        "\x1b[90m"
      )
      await handleBuy(data, blacklist, blacklistedMints, pool)
    } catch (e) {
      console.log("error in handle buy", e)
      totalDestroy()
    }
  })

  pumpFunEvents.on(
    "sell",
    async ({
      coin,
      tx,
      ratio,
    }: {
      coin: CreateTransaction
      tx?: Transaction
      ratio: number
    }) => {
      console.log(
        "\x1b[31m",
        "selled",
        coin.mint,
        new Date().toLocaleTimeString(),
        tx?.marketCapSol.toFixed(2),
        ratio,
        "\x1b[90m"
      )
      try {
        if (await handleSell(coin, tx, pool)) {
          totalDestroy()
        }
      } catch (e) {
        console.log("error in handle sell", e)
        totalDestroy()
      }
    }
  )

  pumpFunEvents.on(
    "tx",
    (data: {
      coin: CreateTransaction
      tx: TransactionWithTs
      result: { signal: number; data: string }
    }) => {
      const { coin, tx } = data
      const buyed = getBuyedTx()

      if (buyed && buyed?.mint !== tx.mint) {
        return
      }

      io.emit("tx", {
        ...tx,
        name: coin.name,
        initialBuy: coin.initialBuy,
      })
    }
  )

  pumpFunEvents.on("new-token", (tx: CreateTransaction) => {
    setCoinCreatingTime(tx.mint, Date.now())
    io.emit("new-coin", tx)
  })

  pumpFunEvents.on("stop", () => {
    totalDestroy()
  })
}
