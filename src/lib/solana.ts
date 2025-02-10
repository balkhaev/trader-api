import {
  createDefaultRpcTransport,
  type RpcTransport,
  address,
  createSolanaRpc,
  createSolanaRpcFromTransport,
  createSolanaRpcSubscriptions,
  getBase64EncodedWireTransaction,
  getTransactionDecoder,
  signTransaction,
} from "@solana/web3.js"
import { createKeyPairFromBytes, signature } from "@solana/keys"
import base58 from "bs58"
import EventEmitter from "events"

export const WALLET_PUBLIC_KEY = process.env.PHANTOM_SOLANA_WALLET!
export const WALLET_PRIVATE_KEY = process.env.PHANTOM_SOLANA_PRIVATE_KEY!

export const DEVNET_POOL = "https://api.devnet.solana.com"
export const MAIN_POOL = "https://api.mainnet-beta.solana.com"

export const HELIUS_POLL =
  "https://mainnet.helius-rpc.com/?api-key=8b29ded5-6414-48d7-8524-319cab564afe"
export const QUICKNODE_POLL =
  "https://tiniest-capable-ensemble.solana-mainnet.quiknode.pro/3ee99c62c9f2f5c7671a3841141b75086e7376c9"

export const WSS_QUICKNODE_POLL =
  "wss://tiniest-capable-ensemble.solana-mainnet.quiknode.pro/3ee99c62c9f2f5c7671a3841141b75086e7376c9"

const transports = [
  createDefaultRpcTransport({ url: MAIN_POOL }),
  createDefaultRpcTransport({ url: HELIUS_POLL }),
  createDefaultRpcTransport({ url: QUICKNODE_POLL }),
]

let nextTransport = 0
async function roundRobinTransport<TResponse>(
  ...args: Parameters<RpcTransport>
): Promise<TResponse> {
  const transport = transports[nextTransport]
  nextTransport = (nextTransport + 1) % transports.length
  return await transport(...args)
}

// Create the RPC client using the round-robin transport.
let rpc = createSolanaRpcFromTransport(roundRobinTransport)

export async function signAndSend(
  unsignedSerializedTx: Uint8Array,
  pool = QUICKNODE_POLL
) {
  if (pool === DEVNET_POOL) {
    rpc = createSolanaRpc(DEVNET_POOL)
  }

  console.log("Signing...")
  try {
    const tx = getTransactionDecoder().decode(unsignedSerializedTx)
    const keypair = await createKeyPairFromBytes(
      base58.decode(WALLET_PRIVATE_KEY),
      true
    )

    const signedTx = await signTransaction([keypair], tx)
    const signature = await rpc
      .sendTransaction(getBase64EncodedWireTransaction(signedTx), {
        encoding: "base64",
        skipPreflight: true,
        preflightCommitment: "confirmed",
      })
      .send()

    return signature
  } catch (error) {
    console.error("Error during signAndSend:", error)
    throw error
  }
}

export async function getMintFromTransaction(txSignature: string) {
  const txDetails = await rpc
    .getTransaction(signature(txSignature), {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    })
    .send()

  if (!txDetails) {
    console.log("Транзакция не найдена")
    return null
  }

  const message = txDetails.transaction.message

  for (const instruction of txDetails.transaction.message.instructions) {
    const programId = message.accountKeys[instruction.programIdIndex]

    if (
      programId.toString() === "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
    ) {
      console.log(instruction)
      const mintAddressIndex = instruction.accounts[0] // Индекс может варьироваться
      const mintAddress =
        txDetails.transaction.message.accountKeys[mintAddressIndex]
      return mintAddress.toString()
    }
  }

  console.log("Инструкция с SPL Token не найдена в транзакции")
  return null
}

export async function getAddressTransactions(publicKey: string) {
  const pubAddress = address(publicKey)

  try {
    const transactions = await rpc
      .getSignaturesForAddress(pubAddress, {
        limit: 10,
        commitment: "confirmed",
      })
      .send()

    return transactions
  } catch (error) {
    console.error(`Ошибка проверки кошелька ${publicKey}:`, error)
    return null
  }
}

export async function isNewWallet(publicKey: string): Promise<boolean> {
  const transactions = await getAddressTransactions(publicKey)

  return transactions ? transactions?.length <= 4 : false
}

export async function onWalletChange(
  publicKey: string,
  abortController: AbortController
): Promise<EventEmitter> {
  const solanaEvents = new EventEmitter()
  const rpcSubscriptions = createSolanaRpcSubscriptions(WSS_QUICKNODE_POLL)

  try {
    const notifications = await rpcSubscriptions
      .accountNotifications(address(publicKey), { commitment: "confirmed" })
      .subscribe({ abortSignal: abortController.signal })

    let lastLamports: number | null = null

    ;(async () => {
      for await (const notification of notifications) {
        try {
          const currentLamports = Number(notification.value.lamports)
          const delta =
            lastLamports !== null ? currentLamports - lastLamports : 0
          lastLamports = currentLamports

          solanaEvents.emit("update", { lamports: currentLamports, delta })
        } catch (innerError) {
          console.error("Error processing notification:", innerError)
        }
      }
    })().catch((error) => {
      if (error.name === "AbortError") {
        console.log("Subscription aborted for", publicKey)
      } else {
        console.error("Unexpected error in subscription loop:", error)
        solanaEvents.emit("error", error)
      }
    })
  } catch (error) {
    console.error("Error during subscription setup:", error)
    solanaEvents.emit("error", error)
  }

  return solanaEvents
}

export async function isSniper(
  publicKey: string,
  timeWindow: number = 3000 // 3 секунды
) {
  try {
    // Получаем последние транзакции кошелька
    const transactions = await getAddressTransactions(publicKey)

    if (!transactions || transactions.length === 0) {
      console.log("История транзакций пуста или недоступна.")
      return false
    }

    console.log(`Найдено ${transactions.length} транзакций.`)

    for (let i = 0; i < transactions.length; i++) {
      for (let j = i + 1; j < transactions.length; j++) {
        const tx1 = transactions[i]
        const tx2 = transactions[j]
        const mint1 = await getMintFromTransaction(tx1.signature)
        const mint2 = await getMintFromTransaction(tx2.signature)

        if (mint1 !== mint2 || !tx1.blockTime || !tx2.blockTime) {
          continue
        }

        const blockTime1 = Number(tx1.blockTime)
        const blockTime2 = Number(tx2.blockTime)

        const timeDifference = Math.abs(
          new Date(blockTime1 * 1000).getTime() -
            new Date(blockTime2 * 1000).getTime()
        )

        // Проверяем типы транзакций (покупка и продажа)
        // if (
        //   tx1.type === "buy" &&
        //   tx2.type === "sell" &&
        //   timeDifference <= timeWindow
        // ) {
        //   console.log(
        //     `Найдены покупка и продажа mint ${mint} в пределах ${timeWindow} мс.`
        //   )
        //   return true
        // }
      }
    }

    // console.log(
    //   `Для mint ${mint} не найдено быстрых операций покупки и продажи.`
    // )
    return false
  } catch (error) {
    console.error("Ошибка при проверке истории транзакций:", error)
    return false
  }
}
