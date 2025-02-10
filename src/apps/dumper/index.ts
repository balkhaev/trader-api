import { configDotenv } from "dotenv"
configDotenv({ path: ".env" })

import { bybitRestClient } from "../bybit/sdk/clients"
import { format, addMinutes } from "date-fns"
import fs from "fs-extra"
import archiver from "archiver"
import { PromisePool } from "@supercharge/promise-pool"
import { KlineIntervalV3 } from "bybit-api"

const SYMBOL = "BTCUSDT"
const MARKET = "bybit"
const LIMIT = 50

const CONFIGS = {
  minute: {
    resolution: "minute",
    interval: "1" as KlineIntervalV3,
    days: 365,
    folder: `Data/crypto/${MARKET}/minute/${SYMBOL}`,
  },
  hour: {
    resolution: "hour",
    interval: "60" as KlineIntervalV3,
    days: 30,
    folder: `Data/crypto/${MARKET}/hour/${SYMBOL}`,
  },
}

async function getKlines(
  symbol: string,
  start: number,
  end: number,
  interval: KlineIntervalV3
) {
  const res = await bybitRestClient.getKline({
    symbol,
    category: "spot",
    interval,
    limit: LIMIT,
    start,
    end,
  })
  return res.result?.list || []
}

function minutesAgo(n: number) {
  return addMinutes(new Date(), -n).getTime()
}

function calculateSteps(days: number, intervalMinutes: number) {
  const totalMinutes = days * 24 * 60
  return Math.ceil(totalMinutes / LIMIT / intervalMinutes)
}

async function processData(configKey: "minute" | "hour") {
  const { resolution, interval, days, folder } = CONFIGS[configKey]
  const steps = calculateSteps(days, configKey === "minute" ? 1 : 60)

  console.log(
    `Сбор ${resolution} данных для ${SYMBOL} за последние ${days} дней...`
  )

  const arr = Array.from({ length: steps }, (_, i) => i)
  await fs.mkdirp(folder)

  const { results } = await PromisePool.withConcurrency(3)
    .for(arr)
    .process(async (index) => {
      const endTs = minutesAgo(
        index * LIMIT * (configKey === "minute" ? 1 : 60)
      )
      const startTs = minutesAgo(
        (index + 1) * LIMIT * (configKey === "minute" ? 1 : 60)
      )

      const realStart = Math.min(startTs, endTs)
      const realEnd = Math.max(startTs, endTs)

      try {
        const data = await getKlines(SYMBOL, realStart, realEnd, interval)
        console.log(
          `Загружен пакет #${index + 1}/${steps}, кол-во записей: ${
            data.length
          }`
        )
        return data
      } catch (err) {
        console.error(`Ошибка при загрузке пакета #${index + 1}:`, err)
        return []
      }
    })

  const allCandles = results.flat()
  allCandles.sort((a, b) => +a[0] - +b[0])

  const groupedData = groupDataByDay(allCandles, resolution)
  await saveGroupedData(groupedData, folder, resolution)
}

function groupDataByDay(candles: any[], resolution: string) {
  const dataMap: Record<string, Array<any>> = {}
  for (const c of candles) {
    const ts = +c[0]
    const open = c[1]
    const high = c[2]
    const low = c[3]
    const close = c[4]
    const volume = c[5]

    const dateObj = new Date(ts)
    const yyyymmdd = format(dateObj, "yyyyMMdd")
    const time =
      resolution === "minute"
        ? getMillisecondsSinceMidnight(dateObj)
        : format(dateObj, "HH:mm")

    if (!dataMap[yyyymmdd]) {
      dataMap[yyyymmdd] = []
    }
    dataMap[yyyymmdd].push({ time, open, high, low, close, volume })
  }
  return dataMap
}

function getMillisecondsSinceMidnight(dateObj: Date) {
  return (
    dateObj.getHours() * 3600000 +
    dateObj.getMinutes() * 60000 +
    dateObj.getSeconds() * 1000 +
    dateObj.getMilliseconds()
  )
}

async function saveGroupedData(
  dataMap: Record<string, any[]>,
  folder: string,
  resolution: string
) {
  for (const day of Object.keys(dataMap)) {
    const candles = dataMap[day]
    const zipFileName = `${day}_trade.zip`
    const zipFilePath = `${folder}/${zipFileName}`
    const csvFileName = `${day}_${SYMBOL}_${resolution}_trade.csv`

    const csvLines = candles.map((c) => Object.values(c).join(","))
    const tmpCsvPath = `${folder}/${csvFileName}`
    await fs.writeFile(tmpCsvPath, csvLines.join("\n"), "utf8")

    const output = fs.createWriteStream(zipFilePath)
    const archive = archiver("zip", { zlib: { level: 9 } })
    archive.pipe(output)
    archive.file(tmpCsvPath, { name: csvFileName })
    await archive.finalize()

    await fs.remove(tmpCsvPath)
    console.log(`Сохранён ${zipFileName} с ${candles.length} записями.`)
  }
}

/**
 * Основная логика
 */
;(async () => {
  console.log("Start dumping data...", process.argv[2])
  await processData(process.argv[2] as "minute" | "hour")
})()
