export const LIMIT_BUYS = parseInt(process.env.LIMIT_BUYS!)

export const longPos = {
  buy: parseInt(process.env.LONG_BUY_USD!),
  stopLoss: parseInt(process.env.STOP_LOSS_LONG_POST!),
  takeProfit: parseInt(process.env.TAKE_PROFIT_LONG_POS!),
}

export const shortPos = {
  buy: parseInt(process.env.SHORT_BUY_USD!),
  stopLoss: parseInt(process.env.STOP_LOSS_SHORT_POS!),
  takeProfit: parseInt(process.env.TAKE_PROFIT_SHORT_POS!),
}
