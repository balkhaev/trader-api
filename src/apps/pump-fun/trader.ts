import { EventEmitter } from "events"
import { isNewWallet, onWalletChange } from "../../lib/solana"
import { StrategyOpts } from "./strategy"
import {
  BuySellTxTs,
  CreateTransaction,
  TransactionWithTs,
  WithTs,
} from "./types"
import { getCoinPrevTxs } from "./state"

function toHumanReadableTime(seconds: number): string {
  if (seconds < 0) {
    throw new Error("Время не может быть отрицательным")
  }

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  const parts: string[] = []
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0 || hours > 0) parts.push(`${minutes}m`)
  parts.push(`${secs}s`)

  return parts.join(" ")
}

type Position = {
  tx: BuySellTxTs
  coin: WithTs<CreateTransaction>
  profit: number
  ratio: number
  tp1: boolean
  tp2: boolean
  tp3: boolean
}

const newbieTrades: Record<string, BuySellTxTs[]> = {}
const coinsWalletListeners: Record<string, AbortController[]> = {}
const listeningWallets: string[] = []
const scamList: string[] = []
const positions: Record<string, Position> = {}
const selledCoins: string[] = []
const coinTxs: Record<string, BuySellTxTs[]> = {}
const buyTimeouts: Record<string, any> = {}

const MINIMUM_BUY_AMOUNT_SOL = 0.09 // 0.1 SOL
export const SCAM_CD = 3000 // 3sec
const LAMPORTS_PER_SOL = 1_000_000_000
const LIFETIME = 180000

const lamportsToSolString = (lamports: number, includeUnit = true): string => {
  const solAmount = lamports / LAMPORTS_PER_SOL
  return `${solAmount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${includeUnit ? "SOL" : ""}`
}

const getTxPrice = (tx: BuySellTxTs) =>
  (tx.vSolInBondingCurve / tx.vTokensInBondingCurve) * tx.tokenAmount

export const traderEvents = new EventEmitter()

traderEvents.setMaxListeners(1000000)

export async function rateTrader(
  tx: TransactionWithTs,
  coin: WithTs<CreateTransaction>,
  opts?: StrategyOpts
) {
  if (
    "tokenAmount" in tx === false ||
    scamList.includes(coin.mint) ||
    selledCoins.includes(coin.mint)
  ) {
    return
  }

  const { traderPublicKey, vSolInBondingCurve } = tx

  coinTxs[coin.mint] = [...(coinTxs[coin.mint] || []), tx]

  const buyPrice = getTxPrice(tx)

  if (Date.now() - coin.timestamp < LIFETIME) {
    return
  }

  // if (Object.keys(positions).length === 0 || coin.mint in positions) {
  if (buyPrice > 1) {
    console.log(
      tx.txType === "buy" ? "\x1b[32m" : "\x1b[31m",
      `https://gmgn.ai/sol/token/${coin.mint}  ${buyPrice.toFixed(
        2
      )}   ${new Date(tx.timestamp).toLocaleTimeString()}    ${(
        (tx.timestamp - coin.timestamp) /
        1000
      ).toFixed(1)}   ${tx.traderPublicKey}`,
      "\x1b[37m"
    )
  }

  // }

  if (tx.txType === "buy") {
    if (tx.mint in positions) {
      const position = positions[tx.mint]
      const profit =
        (vSolInBondingCurve - positions[tx.mint].tx.vSolInBondingCurve) /
        positions[tx.mint].tx.tokenAmount
      const ratio = profit / buyPrice

      if (!position.tp1) {
        if (ratio > 1) {
          traderEvents.emit("sell", coin, tx, 0.3)
          position.tp1 = true
        }
      } else if (!position.tp2) {
        if (ratio > 3) {
          traderEvents.emit("sell", coin, tx, 0.5)
          position.tp2 = true
        }
      } else if (!position.tp3) {
        if (ratio > 10) {
          traderEvents.emit("sell", coin, tx, 1)
          position.tp3 = true
        }
      }

      console.log(
        `${profit.toFixed(2)}`,
        `${buyPrice.toFixed(2)}`,
        ratio >= 1 ? "OKUP!" : "HEOKUP"
      )
    }

    const prevTxs = coinTxs[coin.mint]

    // Проверяем последние транзакции
    const lastBuys = prevTxs.slice(-4)
    const invalidBuys = lastBuys.filter(
      (prevTx) => getTxPrice(prevTx) < MINIMUM_BUY_AMOUNT_SOL
    )

    if (invalidBuys.length === 4) {
      console.log(
        `https://gmgn.ai/sol/token/${coin.mint}`,
        "Покупка менее чем на 0.1 sol в последних 4 транзакциях"
      )
      scamList.push(coin.mint)
      return
    }

    const isGoodBuy = buyPrice >= 0.8 && buyPrice <= 1.5

    if (!isGoodBuy) {
      return
    }

    const isFresh = await isNewWallet(traderPublicKey)

    if (!isFresh) {
      return
    }

    const prevNewbie =
      newbieTrades[coin.mint] && newbieTrades[coin.mint].slice(-1)[0]

    if (prevNewbie && Date.now() - prevNewbie.timestamp < SCAM_CD) {
      console.log(`https://gmgn.ai/sol/token/${coin.mint}`, "BUY NEWBIE")
      // scamList.push(coin.mint)
      // coinsWalletListeners[coin.mint].forEach((controller) =>
      //   controller.abort()
      // )
      clearTimeout(buyTimeouts[coin.mint])
      traderEvents.emit("buy", coin, tx)
      positions[coin.mint] = {
        tx,
        coin,
        ratio: 1,
        profit: 0,
        tp1: false,
        tp2: false,
        tp3: false,
      }
      buyTimeouts[coin.mint] = null
    }

    // if (!listeningWallets.includes(traderPublicKey)) {
    //   const abortController = new AbortController()

    //   coinsWalletListeners[coin.mint] = coinsWalletListeners[coin.mint] || []
    //   coinsWalletListeners[coin.mint].push(abortController)
    //   listeningWallets.push(traderPublicKey)
    //   const emitter = await onWalletChange(traderPublicKey, abortController)

    //   emitter.on("update", ({ lamports, delta }) => {
    //     if (
    //       scamList.includes(coin.mint) ||
    //       selledCoins.includes(coin.mint) ||
    //       coin.mint in buyedCoins === false
    //     ) {
    //       return
    //     }

    //     const sign = delta > 0 ? "+" : delta < 0 ? "-" : "="

    //     console.log(
    //       `New Balance: ${lamportsToSolString(
    //         lamports
    //       )} (${sign}${lamportsToSolString(Math.abs(delta))})`
    //     )
    //   })
    // }

    newbieTrades[coin.mint] = newbieTrades[coin.mint] || []
    newbieTrades[coin.mint].push(tx)

    if (newbieTrades[coin.mint].length === 0) {
      traderEvents.emit("buy", coin, tx)
    }

    console.log("==========")
    console.log(`Трейдер https://gmgn.ai/sol/address/${traderPublicKey}`)
    console.log(
      `На сумму ${buyPrice.toFixed(2)}`,
      new Date().toLocaleTimeString()
    )
    console.log(
      `Монета https://gmgn.ai/sol/token/${coin.mint} (MC ${vSolInBondingCurve})`
    )
    console.log("----------")

    if (coin.mint in buyTimeouts) return

    buyTimeouts[coin.mint] = setTimeout(() => {
      console.log(`Buy timeout setted`)
      const prevTxs = getCoinPrevTxs(coin.mint)
      const prevTx = prevTxs[prevTxs.length - 1]

      if (prevTx.signature === tx.signature) {
        console.log(
          `https://gmgn.ai/sol/token/${coin.mint}`,
          "NO BUYS",
          SCAM_CD
        )
        return
      }

      if (scamList.includes(coin.mint)) {
        console.log(
          `https://gmgn.ai/sol/token/${coin.mint}`,
          "Scam list cancel!"
        )
        return
      }

      if (prevTxs.length < 10) {
        console.log(`https://gmgn.ai/sol/token/${coin.mint}`, "Small hype!")
        return
      }

      // buyedCoins[coin.mint] = tx
      // buyTimeouts[coin.mint] = null
      console.log(`https://gmgn.ai/sol/token/${coin.mint}`, "TRY IT")
      // traderEvents.emit("buy", coin, tx)
    }, SCAM_CD)
  }

  if (
    tx.txType === "sell" &&
    coin.mint in positions &&
    tx.traderPublicKey === positions[coin.mint].tx.traderPublicKey
  ) {
    const ratio = positions[coin.mint].tx.tokenAmount / tx.tokenAmount
    selledCoins.push(coin.mint)
    const isFullSell = ratio > 0.9

    if (isFullSell) {
      delete positions[coin.mint]
    } else {
      positions[coin.mint].tx = tx
    }

    // coinsWalletListeners[coin.mint].forEach((controller) => controller.abort())

    if (buyTimeouts[coin.mint] && isFullSell) {
      console.log(`https://gmgn.ai/sol/token/${coin.mint}`, "CLEAR SOLDED")
      clearTimeout(buyTimeouts[coin.mint])
      buyTimeouts[coin.mint] = null
      return
    }

    traderEvents.emit("sell", coin, tx, ratio)
  }

  return {
    signal: 0,
  }
}
