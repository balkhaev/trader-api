import express from "express"
import { searchTweets } from "./twitter"
import { getCryptoNews } from "./news"
import { dify } from "../../lib/dify"
import { getDifyProgross } from "../ai/dify"

const router = express.Router()

router.get("/twitter/top", async (req, res) => {
  const limit = req.query.limit ? +req.query.limit : 10
  console.log("limit", limit)
  const tweets = await searchTweets("crypto", "top", limit)

  console.log(tweets.length)

  res.json(tweets)
})

router.get("/twitter/latest", async (req, res) => {
  const limit = req.query.limit ? +req.query.limit : 10

  console.log(limit)
  const tweets = await searchTweets("crypto", "latest", limit)

  console.log(tweets.length)

  res.json(tweets)
})

router.get("/news/latest", async (req, res) => {
  const news = await getCryptoNews()

  console.log(news.length)

  res.json(news)
})

router.post("/news/update", async (req, res) => {
  const data = await getDifyProgross()

  res.json({ status: "ok", result: data })
})

router.post("/news", async (req, res) => {
  const data = req.body

  res.json({ status: "ok", result: data })
})

export default router
