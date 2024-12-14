import analyzeBybit from "./analyze"
import { supabase } from "../../lib/supabase"
import { bybitRestClient } from "./sdk/clients"

import express from "express"
import { listenBybit, unlistenBybit } from "./websocket"
import { analyzeSymbolQueue } from "./queue"
import { fetchPositions } from "./sdk/methods"

const router = express.Router()

router.get("/analysis/:symbol", async (req, res) => {
  const { data } = await supabase
    .from("analysis")
    .select("*")
    .filter("symbol", "eq", req.params.symbol)
    .order("created_at", { ascending: false })

  res.json({
    status: "ok",
    result: data,
  })
})

router.post("/analysis", async (req, res) => {
  if (await analyzeSymbolQueue.isPaused()) {
    await analyzeSymbolQueue.resume()

    res.json({
      status: "ok",
    })

    return
  }

  const result = await analyzeBybit()

  res.json({
    status: "ok",
    result,
  })
})

router.get("/status/bybit", async (req, res) => {
  const jobs = await analyzeSymbolQueue.count()
  const isPaused = await analyzeSymbolQueue.isPaused()

  res.json({
    status: "ok",
    result: { working: !isPaused, jobs },
  })
})

router.delete("/analysis", async (req, res) => {
  await analyzeSymbolQueue.pause()

  res.json({
    status: "ok",
  })
})

router.get("/analysis", async (req, res) => {
  const { data } = await supabase.from("analysis").select("*")

  res.json({
    status: "ok",
    result: data,
  })
})

router.post("/analysis/:symbol", async (req, res) => {
  analyzeSymbolQueue.add({ symbol: req.params.symbol }, { lifo: true })

  res.json({
    status: "ok",
  })
})

router.get("/market/:symbol", async (req, res) => {
  const data = await bybitRestClient.getTickers({
    symbol: req.params.symbol,
    category: "spot",
  })

  res.json(data.result)
})

router.post("/market/:symbol/listen", async (req, res) => {
  listenBybit(req.params.symbol)

  res.json({
    status: "ok",
  })
})

router.post("/market/:symbol/unlisten", async (req, res) => {
  unlistenBybit(req.params.symbol)

  res.json({
    status: "ok",
  })
})

router.get("/positions", async (req, res) => {
  const data = await fetchPositions()

  res.json(data)
})

export default router
