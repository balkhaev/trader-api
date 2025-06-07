import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  PumpFunTraderService,
  TradingStrategy,
} from '../services/pumpfun-trader.service';

@Controller('trader')
export class TraderController {
  private readonly logger = new Logger(TraderController.name);

  constructor(private readonly traderService: PumpFunTraderService) {}

  // Получение статуса трейдера
  @Get('status')
  getStatus() {
    try {
      return {
        success: true,
        data: this.traderService.getStatus(),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Ошибка получения статуса: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Запуск трейдера
  @Post('start')
  async startTrader() {
    try {
      await this.traderService.startTrading();

      return {
        success: true,
        message: 'Трейдер успешно запущен',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Ошибка запуска трейдера: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Остановка трейдера
  @Post('stop')
  async stopTrader() {
    try {
      await this.traderService.stopTrading();

      return {
        success: true,
        message: 'Трейдер успешно остановлен',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Ошибка остановки трейдера: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Получение открытых позиций
  @Get('positions')
  getOpenPositions() {
    try {
      const positions = this.traderService.getOpenPositions();

      return {
        success: true,
        data: positions,
        count: positions.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Ошибка получения позиций: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Закрытие всех позиций
  @Post('positions/close-all')
  async closeAllPositions() {
    try {
      await this.traderService.closeAllPositions();

      return {
        success: true,
        message: 'Все позиции успешно закрыты',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Ошибка закрытия позиций: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Принудительная покупка токена
  @Post('buy/:mint')
  async forceBuy(@Param('mint') mint: string) {
    try {
      if (!mint || mint.length !== 44) {
        throw new HttpException(
          'Неверный формат mint адреса',
          HttpStatus.BAD_REQUEST
        );
      }

      const signature = await this.traderService.executeBuy(mint);

      if (signature) {
        return {
          success: true,
          message: 'Покупка выполнена успешно',
          data: { signature },
          timestamp: new Date().toISOString(),
        };
      } else {
        throw new HttpException(
          'Не удалось выполнить покупку',
          HttpStatus.BAD_REQUEST
        );
      }
    } catch (error) {
      this.logger.error(
        `Ошибка принудительной покупки ${mint}: ${error.message}`
      );
      throw new HttpException(
        {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Принудительная продажа токена
  @Post('sell/:mint')
  async forceSell(@Param('mint') mint: string) {
    try {
      if (!mint || mint.length !== 44) {
        throw new HttpException(
          'Неверный формат mint адреса',
          HttpStatus.BAD_REQUEST
        );
      }

      const signature = await this.traderService.executeSell(
        mint,
        'manual_sell'
      );

      if (signature) {
        return {
          success: true,
          message: 'Продажа выполнена успешно',
          data: { signature },
          timestamp: new Date().toISOString(),
        };
      } else {
        throw new HttpException(
          'Не удалось выполнить продажу',
          HttpStatus.BAD_REQUEST
        );
      }
    } catch (error) {
      this.logger.error(
        `Ошибка принудительной продажи ${mint}: ${error.message}`
      );
      throw new HttpException(
        {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Получение настроек стратегии
  @Get('strategy')
  getStrategy() {
    try {
      const strategy = this.traderService.getStrategy();

      return {
        success: true,
        data: strategy,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Ошибка получения стратегии: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Обновление настроек стратегии
  @Put('strategy')
  updateStrategy(@Body() strategyUpdate: Partial<TradingStrategy>) {
    try {
      // Валидация входных данных
      if (strategyUpdate.minMarketCap && strategyUpdate.minMarketCap < 0) {
        throw new HttpException(
          'Минимальная капитализация не может быть отрицательной',
          HttpStatus.BAD_REQUEST
        );
      }

      if (strategyUpdate.maxMarketCap && strategyUpdate.maxMarketCap < 0) {
        throw new HttpException(
          'Максимальная капитализация не может быть отрицательной',
          HttpStatus.BAD_REQUEST
        );
      }

      if (strategyUpdate.buyAmount && strategyUpdate.buyAmount <= 0) {
        throw new HttpException(
          'Размер покупки должен быть больше 0',
          HttpStatus.BAD_REQUEST
        );
      }

      if (
        strategyUpdate.stopLoss &&
        (strategyUpdate.stopLoss < 0 || strategyUpdate.stopLoss > 100)
      ) {
        throw new HttpException(
          'Стоп-лосс должен быть от 0 до 100%',
          HttpStatus.BAD_REQUEST
        );
      }

      if (strategyUpdate.takeProfit && strategyUpdate.takeProfit <= 0) {
        throw new HttpException(
          'Тейк-профит должен быть больше 0%',
          HttpStatus.BAD_REQUEST
        );
      }

      if (strategyUpdate.maxPositions && strategyUpdate.maxPositions <= 0) {
        throw new HttpException(
          'Максимальное количество позиций должно быть больше 0',
          HttpStatus.BAD_REQUEST
        );
      }

      this.traderService.updateStrategy(strategyUpdate);

      return {
        success: true,
        message: 'Настройки стратегии обновлены',
        data: this.traderService.getStrategy(),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Ошибка обновления стратегии: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Получение статистики торговли
  @Get('stats')
  async getTradingStats() {
    try {
      const stats = await this.traderService.getTradingStats();

      return {
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Ошибка получения статистики: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Анализ конкретного токена
  @Get('analyze/:mint')
  async analyzeToken(@Param('mint') mint: string) {
    try {
      if (!mint || mint.length !== 44) {
        throw new HttpException(
          'Неверный формат mint адреса',
          HttpStatus.BAD_REQUEST
        );
      }

      // Сначала получаем информацию о токене через PumpPortal
      const tokenInfo =
        await this.traderService['pumpPortalService'].getTokenInfo(mint);

      if (!tokenInfo) {
        throw new HttpException('Токен не найден', HttpStatus.NOT_FOUND);
      }

      // Анализируем токен
      const shouldBuy = await this.traderService.analyzeNewToken(tokenInfo);

      return {
        success: true,
        data: {
          token: tokenInfo,
          analysis: {
            shouldBuy,
            recommendation: shouldBuy ? 'BUY' : 'SKIP',
            reasons: this.getAnalysisReasons(tokenInfo, shouldBuy),
          },
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Ошибка анализа токена ${mint}: ${error.message}`);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Получение причин анализа (вспомогательный метод)
  private getAnalysisReasons(tokenInfo: any, shouldBuy: boolean): string[] {
    const reasons = [];
    const strategy = this.traderService.getStrategy();

    // Возраст токена
    const tokenAge = Date.now() - tokenInfo.createdAt.getTime();
    const ageInMinutes = tokenAge / (1000 * 60);

    if (ageInMinutes <= strategy.maxAge) {
      reasons.push(`✅ Токен свежий: ${ageInMinutes.toFixed(1)} минут`);
    } else {
      reasons.push(`❌ Токен слишком старый: ${ageInMinutes.toFixed(1)} минут`);
    }

    // Капитализация
    if (
      tokenInfo.marketCap >= strategy.minMarketCap &&
      tokenInfo.marketCap <= strategy.maxMarketCap
    ) {
      reasons.push(
        `✅ Подходящая капитализация: $${tokenInfo.marketCap.toLocaleString()}`
      );
    } else {
      reasons.push(
        `❌ Неподходящая капитализация: $${tokenInfo.marketCap.toLocaleString()}`
      );
    }

    // Объем торгов
    if (tokenInfo.volume24h >= strategy.minVolume24h) {
      reasons.push(
        `✅ Достаточный объем: $${tokenInfo.volume24h.toLocaleString()}`
      );
    } else {
      reasons.push(
        `❌ Недостаточный объем: $${tokenInfo.volume24h.toLocaleString()}`
      );
    }

    return reasons;
  }

  // Получение детальной информации о позиции
  @Get('positions/:mint')
  getPositionDetails(@Param('mint') mint: string) {
    try {
      if (!mint || mint.length !== 44) {
        throw new HttpException(
          'Неверный формат mint адреса',
          HttpStatus.BAD_REQUEST
        );
      }

      const positions = this.traderService.getOpenPositions();
      const position = positions.find((p) => p.mint === mint);

      if (!position) {
        throw new HttpException('Позиция не найдена', HttpStatus.NOT_FOUND);
      }

      return {
        success: true,
        data: position,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `Ошибка получения детальной информации о позиции ${mint}: ${error.message}`
      );
      throw new HttpException(
        {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
