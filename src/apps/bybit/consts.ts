export const LIMIT_BUYS = parseInt(process.env.LIMIT_BUYS!)

export const longPos = {
  buy: parseFloat(process.env.LONG_BUY_USD!),
  stopLoss: parseFloat(process.env.STOP_LOSS_LONG_POST!),
  takeProfit: parseFloat(process.env.TAKE_PROFIT_LONG_POS!),
}

export const shortPos = {
  buy: parseFloat(process.env.SHORT_BUY_USD!),
  stopLoss: parseFloat(process.env.STOP_LOSS_SHORT_POS!),
  takeProfit: parseFloat(process.env.TAKE_PROFIT_SHORT_POS!),
}
