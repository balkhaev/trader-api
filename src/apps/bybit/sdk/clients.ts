import { WebsocketClient, RestClientV5 } from "bybit-api"

const key = process.env.BYBIT_API_KEY!
const secret = process.env.BYBIT_API_SECRET!

export const bybitRestClient = new RestClientV5(
  { key, secret, testnet: false },
  {
    proxy: {
      protocol: "http",
      host: "proxy.scrapingbee.com",
      port: 8886,
      auth: {
        username: process.env.SCRAPINGBEE_KEY!,
        password: "render_js=False&premium_proxy=True",
      },
    },
  }
)

export const bybitWsClient = new WebsocketClient({
  market: "v5",
  testnet: false,
})
