import { supabase } from "../../lib/supabase"
import { getCoinmarketNews, getCryptoNews } from "./news"
import { getUserTweets, searchTweets } from "./twitter"

export const startScrapper = async () => {
  // const cryptonews = await getCryptoNews()
  // const coinmarketnews = await getCoinmarketNews()
}

export const checkTweets = async (query: string) => {
  const tweets = await searchTweets(query, "latest")
  const { error } = await supabase.from("tweets").insert(
    tweets.map((t) => ({
      content: t.text,
      likes: t.likes,
      retweets: t.retweets,
      author: t.username,
      bookmarks: t.bookmarkCount,
      hashtags: t.hashtags,
      views: t.views,
    }))
  )
  console.log(error)
}

export function startTwitterScrapper() {
  const query = "#btc #crypto"

  checkTweets(query)
  setInterval(checkTweets, 30 * 60 * 1000, query)
}
