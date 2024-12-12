export type BybitWS = {
  topic: string
  data: any
  type: string
}

export type AllowedIntervals = "1" | "3" | "15" | "30"

export interface Trade {
  time: number // Unix timestamp в секундах
  price: number
  volume: number
}
