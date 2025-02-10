import WebSocket from "ws"
import { sendPumpTransaction } from "./send-transaction"

export function watchForPumpsTraders() {
  const tradersChannel = new WebSocket("wss://pumpportal.fun/api/data")

  tradersChannel.on("open", function open() {
    tradersChannel.send(
      JSON.stringify({
        method: "subscribeAccountTrade",
        keys: [
          "dc5djqFbA9MmV8QJF4xJ3dAermM69AeQuXFMiBu6X2K",
          "DH5picTwbyk6CrRxVBn4tYwRY2axzEkma1ywtZiuBkrF",
          "52neg7u3r43qkPXGYA357q6iNhCeE7tjReGfFZMKBmAF",
          "43S5gbuHtC3UQxhdEzJpts1S1afmCqoGUEFx5iUhMznM",
          "BrNoqdHUCcv9yTncnZeSjSov8kqhpmzv1nAiPbq1M95H",
          "2d5ZuF3aSjxH9ynzU7t2cSGg6NaXD5bbVWDCHUj2qeiC",
          "9ovH9o5yuRTf8CZv4sH1pVdBJT4TBtuRtAknRV5drdtV",
          "APR6NJqfgMA7kUyMckrKf3VAsWYjuGdae14guscBFhwU",
          "411PvrQWULCFFF9QFUxhtJL2HbYZHxf8CwthktTrpEVQ",
          "DQQGPTMJjcrgULnX6dx3aN8p3tTpB5aySMTwJhqng1H5",
          "F91a2rUeUv4VrnbPkxZJRncTXVdiGUeno74vbXVPhDwj",
          "2LUc3xsB8rBDZZRiTthtJGs22p87kUiN7XWe1AnXS9qN",
          "3ZwcmS6iVFd4tDCoa9UwLQgrDvqippVNvxVbaBHS5597",
        ],
      })
    )
  })

  tradersChannel.on("message", (data: any) => {
    const parsed = JSON.parse(data.toString())

    console.log(new Date().toLocaleTimeString(), data, parsed)
    if (parsed.message) return

    const { mint, txType, traderPublicKey, solAmount } = parsed

    console.log({ txType, traderPublicKey, mint, solAmount })

    sendPumpTransaction({ action: "buy", mint, amount: 0.01 })
  })
}
