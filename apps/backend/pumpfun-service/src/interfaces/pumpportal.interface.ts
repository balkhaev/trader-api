// Интерфейсы для Lightning Transaction API
export interface LightningTradeRequest {
  action: "buy" | "sell"
  mint: string
  amount: number | string
  denominatedInSol: boolean
  slippage: number
  priorityFee: number
  pool?:
    | "pump"
    | "raydium"
    | "pump-amm"
    | "launchlab"
    | "raydium-cpmm"
    | "bonk"
    | "auto"
  skipPreflight?: boolean
  jitoOnly?: boolean
}

export interface LightningTradeResponse {
  signature?: string
  error?: string
}

// Интерфейсы для Local Transaction API
export interface LocalTradeRequest {
  publicKey: string
  action: "buy" | "sell"
  mint: string
  amount: number | string
  denominatedInSol: boolean
  slippage: number
  priorityFee: number
  pool?:
    | "pump"
    | "raydium"
    | "pump-amm"
    | "launchlab"
    | "raydium-cpmm"
    | "bonk"
    | "auto"
}

// WebSocket данные
export interface TokenCreationEvent {
  method: "tokenCreated"
  data: {
    mint: string
    name: string
    symbol: string
    description: string
    image: string
    dev: string
    timestamp: number
    supply: string
    marketCap: number
  }
}

export interface TokenTradeEvent {
  method: "tokenTrade"
  data: {
    mint: string
    traderPublicKey: string
    txType: "buy" | "sell"
    sol: number
    tokenAmount: string
    bondingCurveKey: string
    newTokenReserves: string
    newSolReserves: string
    timestamp: number
    signature: string
  }
}

export interface AccountTradeEvent {
  method: "accountTrade"
  data: {
    account: string
    mint: string
    txType: "buy" | "sell"
    sol: number
    tokenAmount: string
    timestamp: number
    signature: string
  }
}

export interface MigrationEvent {
  method: "migration"
  data: {
    mint: string
    name: string
    symbol: string
    signature: string
    timestamp: number
  }
}

export type WebSocketEvent =
  | TokenCreationEvent
  | TokenTradeEvent
  | AccountTradeEvent
  | MigrationEvent

// Подписки на данные
export interface SubscriptionRequest {
  method:
    | "subscribeNewToken"
    | "subscribeTokenTrade"
    | "subscribeAccountTrade"
    | "subscribeMigration"
  keys?: string[] // для токенов или аккаунтов
}

export interface UnsubscriptionRequest {
  method:
    | "unsubscribeNewToken"
    | "unsubscribeTokenTrade"
    | "unsubscribeAccountTrade"
    | "unsubscribeMigration"
  keys?: string[]
}

// Данные о токене
export interface TokenInfo {
  mint: string
  name: string
  symbol: string
  description: string
  image: string
  dev: string
  createdAt: Date
  supply: string
  marketCap: number
  price: number
  volume24h: number
  holders: number
  isGraduated: boolean
  raydiumPool?: string
}

// Данные о сделке
export interface TradeInfo {
  signature: string
  mint: string
  trader: string
  type: "buy" | "sell"
  solAmount: number
  tokenAmount: string
  price: number
  timestamp: Date
  bondingCurveKey: string
  newTokenReserves: string
  newSolReserves: string
}

// Статистика по токену
export interface TokenStats {
  mint: string
  price: number
  priceChange24h: number
  volume24h: number
  marketCap: number
  holders: number
  totalTrades: number
  buyTrades24h: number
  sellTrades24h: number
  topHolders: Array<{
    address: string
    balance: string
    percentage: number
  }>
}

// Конфигурация API
export interface PumpPortalConfig {
  apiKey?: string
  baseUrl: string
  wsUrl: string
  lightningWallet?: {
    publicKey: string
    privateKey: string
  }
  solana?: {
    rpcEndpoint: string
    commitment: string
  }
}
