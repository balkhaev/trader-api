interface CTIData {
  cti: number
  close: number
  mean: number
  max: number
  min: number
}

export function calculateCTI(prices: number[], period: number): CTIData[] {
  if (prices.length < period) {
    throw new Error("Not enough data points to calculate CTI.")
  }

  const ctiData: CTIData[] = []
  for (let i = 0; i <= prices.length - period; i++) {
    const slice = prices.slice(i, i + period)
    const close = slice[slice.length - 1]
    const mean = slice.reduce((sum, price) => sum + price, 0) / period
    const max = Math.max(...slice)
    const min = Math.min(...slice)

    const cti = ((close - mean) * 100) / (max - min)
    ctiData.push({ cti, close, mean, max, min })
  }

  return ctiData
}
