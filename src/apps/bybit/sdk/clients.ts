import { WebsocketClient, RestClientV5 } from "bybit-api"
import { HttpsProxyAgent } from "https-proxy-agent"
import { SocksProxyAgent } from "socks-proxy-agent"

const key = process.env.BYBIT_API_KEY!
const secret = process.env.BYBIT_API_SECRET!

// const proxyAgent = new HttpsProxyAgent(
//   "http://customer-3v5s610048-region-europe:04bhtjsd@proxy.goproxy.com:30000"
// )
// const socksAgent = new SocksProxyAgent(
//   "socks5://customer-3v5s610048:04bhtjsd@proxy.goproxy.com:30000"
// )

export const bybitRestClient = new RestClientV5(
  { key, secret, testnet: false },
  {
    // httpAgent: proxyAgent,
    // httpsAgent: proxyAgent,
  }
)

export const bybitWsClient = new WebsocketClient({
  market: "v5",
  testnet: false,
})
