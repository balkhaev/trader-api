import { configDotenv } from "dotenv"
import { bybitRestClient } from "./apps/bybit/sdk/clients"

configDotenv({ path: ".env" })
const axios = require("axios")

console.log("TEST")
;(async () => {
  console.log("TEST1")

  bybitRestClient
    .getTickers({
      category: "spot",
      baseCoin: "BTC",
    })
    .then((res) => console.log(res))

  // const res2 = await axios.get("https://app.scrapingbee.com/api/v1", {
  //   params: {
  //     api_key:
  //       "AZ8MWS8PXJR3VXHQ0YZZ70K34O89GUVYIN98VMF81CQ6ZFVL1RP3WJPMCK0IG4PQ8JUF5Z0OZ979E4FP",
  //     url: "https://help.scrapingbee.com/en/article/getting-started-102sb0i/",
  //   },
  // })

  // console.log(res2.data)
})()
