import { Scraper, SearchMode, Tweet } from "agent-twitter-client"
import twcookies from "./cookies.json"

export async function searchTweets(
  query: string,
  mode?: "latest" | "top",
  limit = 10
) {
  const scraper = new Scraper()
  // await scraper.login(
  //   process.env.TWITTER_USERNAME!,
  //   process.env.TWITTER_PASSWORD!,
  //   process.env.TWITTER_EMAIL
  // )

  await scraper.setCookies(twcookies)

  console.log("setted")

  const res = await scraper.fetchSearchTweets(
    query,
    limit,
    mode === "latest" ? SearchMode.Latest : SearchMode.Top
  )
  console.log(res)
  return res.tweets
  // const iterator = scraper.searchTweets(
  //   query,
  //   limit,
  //   mode === "latest" ? SearchMode.Latest : SearchMode.Top
  // )

  // const result: Tweet[] = []

  // for await (const value of iterator) {
  //   console.log(value)
  //   result.push(value)
  // }

  // return result
}

export async function getUserTweets(user: string) {
  // const { tweets } = await scraper.getUserTweets(user)
  // return tweets
}
