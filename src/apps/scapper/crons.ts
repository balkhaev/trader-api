import { getUserTweets, searchTweets } from "./methods"

export const checkTweets = async () => {
  const a = await searchTweets("BTC", "latest")
  // const b = await getUserTweets("CoinDesk")

  console.log(a)
}

export function startScrapper() {
  setInterval(checkTweets, 40000)
}
