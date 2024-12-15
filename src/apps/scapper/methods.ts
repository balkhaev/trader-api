import { Scraper, SearchMode, Tweet } from "agent-twitter-client"

export async function searchTweets(query: string, mode?: "latest" | "top") {
  const scraper = new Scraper()

  await scraper.login(
    process.env.TWITTER_USERNAME!,
    process.env.TWITTER_PASSWORD!,
    process.env.TWITTER_EMAIL
  )

  // return await scraper.fetchSearchTweets(
  //   query,
  //   20,
  //   mode === "latest" ? SearchMode.Latest : SearchMode.Top
  // )
  const iterator = scraper.searchTweets(
    query,
    10,
    mode === "latest" ? SearchMode.Latest : SearchMode.Top
  )

  const result: Tweet[] = []

  for await (const value of iterator) {
    result.push(value)
  }

  return result
}

export async function getUserTweets(user: string) {
  // const { tweets } = await scraper.getUserTweets(user)
  // return tweets
}
