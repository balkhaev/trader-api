import { configDotenv } from "dotenv"
configDotenv({ path: ".env" })
import { bybitRestClient } from "./apps/bybit/sdk/clients"

const axios = require("axios")

console.log("TEST")
;(async () => {
  console.log("TEST1")

  bybitRestClient
    .getWalletBalance({ accountType: "UNIFIED" })
    .then((res) => console.log(res.result.list[0].coin))

  // const res2 = await axios.get("https://app.scrapingbee.com/api/v1", {
  //   params: {
  //     api_key:
  //       "AZ8MWS8PXJR3VXHQ0YZZ70K34O89GUVYIN98VMF81CQ6ZFVL1RP3WJPMCK0IG4PQ8JUF5Z0OZ979E4FP",
  //     url: "https://help.scrapingbee.com/en/article/getting-started-102sb0i/",
  //   },
  // })

  // console.log(res2.data)
})()
