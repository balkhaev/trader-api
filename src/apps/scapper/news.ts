import puppeteer from "rebrowser-puppeteer"

export async function getCryptoNews() {
  const browser = await puppeteer.launch({ headless: false })
  const page = await browser.newPage()

  page.goto("https://cryptonews.com/news/")

  await page.waitForSelector(".archive-template-latest-news__wrap", {
    timeout: 5000,
  })

  const res = await page.evaluate(() => {
    const $body = document.querySelectorAll(
      ".archive-template-latest-news__wrap"
    )

    return [...$body]?.map((el) => {
      if (!el) return null

      return {
        title: el.querySelector(".archive-template-latest-news__title")
          ?.textContent,
        link: el.querySelector<HTMLAnchorElement>(
          "a.archive-template-latest-news"
        )?.href,
        description: el?.querySelector(
          ".archive-template-latest-news__description"
        )?.textContent,
        time: el
          .querySelector(".archive-template-latest-news__time")
          ?.getAttribute("data-utctime"),
      }
    })
  })

  await browser.close()

  return res
}

export async function getCoinmarketNews() {
  const browser = await puppeteer.launch({ headless: false })
  const page = await browser.newPage()

  page.goto("https://coinmarketcap.com/headlines/news/")

  await page.waitForSelector(".infinite-scroll-component", {
    timeout: 5000,
  })

  const res = await page.evaluate(() => {
    const $body = document.querySelectorAll(
      ".infinite-scroll-component .uikit-row"
    )

    return [...$body]?.map((el, i) => {
      if (!el || i === 0) return null

      return {
        title: el.querySelector(".archive-template-latest-news__title")
          ?.textContent,
        link: el.querySelector<HTMLAnchorElement>(
          "a.archive-template-latest-news"
        )?.href,
        description: el?.querySelector(
          ".archive-template-latest-news__description"
        )?.textContent,
        time: el
          .querySelector(".archive-template-latest-news__time")
          ?.getAttribute("data-utctime"),
      }
    })
  })

  await browser.close()

  return res
}
