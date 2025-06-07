import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  Logger,
} from "@nestjs/common"
import { PumpPortalService } from "../services/pumpportal.service"
import {
  LightningTradeDto,
  LocalTradeDto,
  TokenQueryDto,
} from "../dto/trade.dto"

@Controller("trading")
export class TradingController {
  private readonly logger = new Logger(TradingController.name)

  constructor(private readonly pumpPortalService: PumpPortalService) {}

  @Post("lightning")
  async executeLightningTrade(@Body() tradeDto: LightningTradeDto) {
    this.logger.log(
      `Lightning trade request: ${tradeDto.action} ${tradeDto.amount} ${tradeDto.mint}`
    )

    const result = await this.pumpPortalService.executeLightningTrade({
      action: tradeDto.action,
      mint: tradeDto.mint,
      amount: tradeDto.amount,
      denominatedInSol: tradeDto.denominatedInSol,
      slippage: tradeDto.slippage,
      priorityFee: tradeDto.priorityFee,
      pool: tradeDto.pool,
      skipPreflight: tradeDto.skipPreflight,
      jitoOnly: tradeDto.jitoOnly,
    })

    return {
      success: !result.error,
      data: result,
      timestamp: new Date().toISOString(),
    }
  }

  @Post("local")
  async createLocalTransaction(@Body() tradeDto: LocalTradeDto) {
    this.logger.log(
      `Local trade request: ${tradeDto.action} ${tradeDto.amount} ${tradeDto.mint}`
    )

    try {
      const transaction = await this.pumpPortalService.createLocalTransaction({
        publicKey: tradeDto.publicKey,
        action: tradeDto.action,
        mint: tradeDto.mint,
        amount: tradeDto.amount,
        denominatedInSol: tradeDto.denominatedInSol,
        slippage: tradeDto.slippage,
        priorityFee: tradeDto.priorityFee,
        pool: tradeDto.pool,
      })

      // Конвертируем ArrayBuffer в base64 для передачи через JSON
      const transactionBase64 = Buffer.from(transaction).toString("base64")

      return {
        success: true,
        data: {
          transaction: transactionBase64,
          instructions:
            "Используйте эту транзакцию для локального подписания и отправки через ваш RPC",
        },
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      this.logger.error(
        `Ошибка создания локальной транзакции: ${error.message}`
      )
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }
    }
  }

  @Get("tokens")
  async getTokens(@Query() query: TokenQueryDto) {
    this.logger.log(
      `Запрос токенов: limit=${query.limit}, offset=${query.offset}`
    )

    const tokens = await this.pumpPortalService.getTokens(
      query.limit,
      query.offset
    )

    return {
      success: true,
      data: tokens,
      count: tokens.length,
      timestamp: new Date().toISOString(),
    }
  }

  @Get("tokens/:mint")
  async getTokenInfo(@Param("mint") mint: string) {
    this.logger.log(`Запрос информации о токене: ${mint}`)

    const tokenInfo = await this.pumpPortalService.getTokenInfo(mint)

    if (!tokenInfo) {
      return {
        success: false,
        error: "Токен не найден",
        timestamp: new Date().toISOString(),
      }
    }

    return {
      success: true,
      data: tokenInfo,
      timestamp: new Date().toISOString(),
    }
  }

  @Get("tokens/:mint/stats")
  async getTokenStats(@Param("mint") mint: string) {
    this.logger.log(`Запрос статистики токена: ${mint}`)

    const stats = await this.pumpPortalService.getTokenStats(mint)

    if (!stats) {
      return {
        success: false,
        error: "Статистика токена не найдена",
        timestamp: new Date().toISOString(),
      }
    }

    return {
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    }
  }

  @Get("trades")
  async getLatestTrades(
    @Query("mint") mint?: string,
    @Query("limit") limit: string = "10"
  ) {
    const limitNum = parseInt(limit) || 10
    this.logger.log(`Запрос последних сделок: mint=${mint}, limit=${limitNum}`)

    const trades = await this.pumpPortalService.getLatestTrades(mint, limitNum)

    return {
      success: true,
      data: trades,
      count: trades.length,
      timestamp: new Date().toISOString(),
    }
  }
}
