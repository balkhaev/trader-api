import express from "express"
import http from "http"
import cors from "cors"

import pumpRouter from "../apps/pump-fun/router"
import bybitRouter from "../apps/bybit/router"
import scapperRouter from "../apps/scapper/router"
import { createWebSocketServer } from "./websocket"
import { createBullServer } from "./bull"
import { createCopilot } from "./copilot"

const routers = [pumpRouter, bybitRouter, scapperRouter]

export const app = express()
export const server = http.createServer(app)
export const io = createWebSocketServer(server)

app.use(express.json())
app.use(cors({ origin: true }))

createBullServer(app)
createCopilot(app)

routers.forEach((router) => app.use(router))
