import {
  ADX,
  ATR,
  BollingerBands,
  CCI,
  EMA,
  MACD,
  OBV,
  RSI,
  SMA,
  StochasticRSI,
  Stochastic,
} from "technicalindicators"
import { Analyze, Candle } from "../../types"
import { mom } from "./indicators/mom"
import { calculateCTI } from "./indicators/cti"

type IndicatorPeriods = {
  sma?: number
  rsi?: number
  rsiFast?: number
  rsiSlow?: number
  macdFast?: number
  macdSlow?: number
  macdSignal?: number
  bollinger?: number
  bollingerStdDev?: number
  stochasticRsi?: number
  adx?: number
  cti?: number
  cci?: number
  atr?: number
  momentum?: number
  ema?: number
  ma120?: number
  ma240?: number
  stochPeriod?: number
  stochSignal?: number
}

const DEFAULT_PERIODS: Required<IndicatorPeriods> = {
  sma: 15,
  rsi: 14,
  rsiSlow: 20,
  rsiFast: 4,
  macdFast: 12,
  macdSlow: 26,
  macdSignal: 9,
  bollinger: 20,
  bollingerStdDev: 2,
  stochasticRsi: 14,
  adx: 14,
  cti: 20,
  cci: 20,
  atr: 14,
  momentum: 10,
  ema: 20,
  ma120: 50,
  ma240: 25,
  stochPeriod: 5,
  stochSignal: 3,
}

export function getTechnicalAnalyze(
  candles: Candle[],
  periods: IndicatorPeriods = {}
): Analyze {
  const {
    sma,
    rsi,
    rsiFast,
    rsiSlow,
    macdFast,
    macdSlow,
    macdSignal,
    bollinger,
    bollingerStdDev,
    stochasticRsi,
    adx,
    cti,
    cci,
    atr,
    momentum,
    ema,
    ma120,
    ma240,
    stochPeriod,
    stochSignal,
  } = { ...DEFAULT_PERIODS, ...periods }

  const prices = candles.map((d) => d.close)
  const highs = candles.map((d) => d.high)
  const lows = candles.map((d) => d.low)
  const volumes = candles.map((d) => d.volume)

  const [lastSMA] =
    SMA.calculate({ values: prices, period: sma }).slice(-1) ?? []
  const [lastMa120] =
    SMA.calculate({ values: prices, period: ma120 }).slice(-1) ?? []
  const [lastMa240] =
    SMA.calculate({ values: prices, period: ma240 }).slice(-1) ?? []

  const [lastRSI] =
    RSI.calculate({ values: prices, period: rsi }).slice(-1) ?? []
  const [lastRSISlow] =
    RSI.calculate({ values: prices, period: rsiSlow }).slice(-1) ?? []
  const [lastRSIFast] =
    RSI.calculate({ values: prices, period: rsiFast }).slice(-1) ?? []

  const [lastCTI] = calculateCTI(prices, cti).slice(-1) ?? []

  const [lastMACD] =
    MACD.calculate({
      values: prices,
      fastPeriod: macdFast,
      slowPeriod: macdSlow,
      signalPeriod: macdSignal,
      SimpleMAOscillator: false,
      SimpleMASignal: false,
    }).slice(-1) ?? []

  const [lastBollinger] =
    BollingerBands.calculate({
      values: prices,
      period: bollinger,
      stdDev: bollingerStdDev,
    }).slice(-1) ?? []

  const [lastStochasticRsi] =
    StochasticRSI.calculate({
      values: prices,
      rsiPeriod: rsi,
      stochasticPeriod: stochasticRsi,
      kPeriod: 3,
      dPeriod: 3,
    }).slice(-1) ?? []

  // Рассчитываем fastk с помощью стохастика (аналог STOCHF из Python)
  const stochValues = Stochastic.calculate({
    high: highs,
    low: lows,
    close: prices,
    period: stochPeriod,
    signalPeriod: stochSignal,
  })
  const lastStoch = stochValues.slice(-1)[0]
  const fastk = lastStoch ? lastStoch.k : null

  const [lastADX] =
    ADX.calculate({ close: prices, high: highs, low: lows, period: adx }).slice(
      -1
    ) ?? []
  const [lastCCI] =
    CCI.calculate({ high: highs, low: lows, close: prices, period: cci }).slice(
      -1
    ) ?? []
  const [lastATR] =
    ATR.calculate({ high: highs, low: lows, close: prices, period: atr }).slice(
      -1
    ) ?? []
  const [lastOBV] =
    OBV.calculate({ close: prices, volume: volumes }).slice(-1) ?? []
  const [lastMomentum] = mom(prices, momentum).slice(-1) ?? []
  const [lastEma] =
    EMA.calculate({ values: prices, period: ema }).slice(-1) ?? []

  const lastPrice = prices[prices.length - 1]

  return {
    lastPrice,
    sma: lastSMA ?? null,
    rsi: lastRSI ?? null,
    rsiSlow: lastRSISlow ?? null,
    rsiFast: lastRSIFast ?? null,
    stochasticRsi: lastStochasticRsi ?? null,
    adx: lastADX ?? null,
    macd: lastMACD ?? null,
    bollingerBands: lastBollinger ?? null,
    cci: lastCCI ?? null,
    cti: lastCTI?.cti ?? null,
    atr: lastATR ?? null,
    obv: lastOBV ?? null,
    momentum: lastMomentum ?? null,
    ema: lastEma ?? null,
    ma120: lastMa120 ?? null,
    ma240: lastMa240 ?? null,
    fastk,
  }
}
