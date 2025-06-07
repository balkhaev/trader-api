import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsIn,
  IsPositive,
  Min,
  Max,
} from "class-validator"

export class LightningTradeDto {
  @IsIn(["buy", "sell"])
  action: "buy" | "sell"

  @IsString()
  mint: string

  @IsPositive()
  amount: number

  @IsBoolean()
  denominatedInSol: boolean

  @IsNumber()
  @Min(0.1)
  @Max(50)
  slippage: number

  @IsNumber()
  @IsPositive()
  priorityFee: number

  @IsOptional()
  @IsIn([
    "pump",
    "raydium",
    "pump-amm",
    "launchlab",
    "raydium-cpmm",
    "bonk",
    "auto",
  ])
  pool?:
    | "pump"
    | "raydium"
    | "pump-amm"
    | "launchlab"
    | "raydium-cpmm"
    | "bonk"
    | "auto"

  @IsOptional()
  @IsBoolean()
  skipPreflight?: boolean

  @IsOptional()
  @IsBoolean()
  jitoOnly?: boolean
}

export class LocalTradeDto {
  @IsString()
  publicKey: string

  @IsIn(["buy", "sell"])
  action: "buy" | "sell"

  @IsString()
  mint: string

  @IsPositive()
  amount: number

  @IsBoolean()
  denominatedInSol: boolean

  @IsNumber()
  @Min(0.1)
  @Max(50)
  slippage: number

  @IsNumber()
  @IsPositive()
  priorityFee: number

  @IsOptional()
  @IsIn([
    "pump",
    "raydium",
    "pump-amm",
    "launchlab",
    "raydium-cpmm",
    "bonk",
    "auto",
  ])
  pool?:
    | "pump"
    | "raydium"
    | "pump-amm"
    | "launchlab"
    | "raydium-cpmm"
    | "bonk"
    | "auto"
}

export class SubscribeDto {
  @IsIn([
    "subscribeNewToken",
    "subscribeTokenTrade",
    "subscribeAccountTrade",
    "subscribeMigration",
  ])
  method:
    | "subscribeNewToken"
    | "subscribeTokenTrade"
    | "subscribeAccountTrade"
    | "subscribeMigration"

  @IsOptional()
  @IsString({ each: true })
  keys?: string[]
}

export class UnsubscribeDto {
  @IsIn([
    "unsubscribeNewToken",
    "unsubscribeTokenTrade",
    "unsubscribeAccountTrade",
    "unsubscribeMigration",
  ])
  method:
    | "unsubscribeNewToken"
    | "unsubscribeTokenTrade"
    | "unsubscribeAccountTrade"
    | "unsubscribeMigration"

  @IsOptional()
  @IsString({ each: true })
  keys?: string[]
}

export class TokenQueryDto {
  @IsOptional()
  @IsString()
  mint?: string

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10

  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number = 0
}
