import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PumpPortalService } from './pumpportal.service';
import { TokenEntity } from '../entities/token.entity';
import { TradeEntity } from '../entities/trade.entity';
import { TradingPositionEntity } from '../entities/trading-position.entity';
import {
  TokenInfo,
  TokenStats,
  LightningTradeRequest,
  SubscriptionRequest,
} from '../interfaces/pumpportal.interface';

// Интерфейсы для торговых стратегий
export interface TradingStrategy {
  name: string;
  enabled: boolean;
  minMarketCap: number;
  maxMarketCap: number;
  minVolume24h: number;
  maxAge: number; // в минутах
  buyAmount: number; // в SOL
  stopLoss: number; // в процентах
  takeProfit: number; // в процентах
  maxPositions: number;
  slippage: number;
  priorityFee: number;
}

export interface TradePosition {
  id: string;
  mint: string;
  entryPrice: number;
  amount: number; // количество токенов
  solInvested: number;
  timestamp: Date;
  status: 'open' | 'closed' | 'stop_loss' | 'take_profit';
  exitPrice?: number;
  pnl?: number;
}

export interface TradingStats {
  totalTrades: number;
  winTrades: number;
  loseTrades: number;
  totalPnl: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  maxDrawdown: number;
  totalVolume: number;
}

@Injectable()
export class PumpFunTraderService {
  private readonly logger = new Logger(PumpFunTraderService.name);
  private positions = new Map<string, TradePosition>();
  private isTrading = false;
  private watchedTokens = new Set<string>();

  // Настройки по умолчанию
  private defaultStrategy: TradingStrategy = {
    name: 'Momentum Scanner',
    enabled: true,
    minMarketCap: 10000, // $10k
    maxMarketCap: 1000000, // $1M
    minVolume24h: 5000, // $5k
    maxAge: 30, // 30 минут
    buyAmount: 0.1, // 0.1 SOL
    stopLoss: 20, // 20%
    takeProfit: 50, // 50%
    maxPositions: 5,
    slippage: 5, // 5%
    priorityFee: 0.001, // 0.001 SOL
  };

  constructor(
    private configService: ConfigService,
    private pumpPortalService: PumpPortalService,
    @InjectRepository(TokenEntity)
    private tokenRepository: Repository<TokenEntity>,
    @InjectRepository(TradeEntity)
    private tradeRepository: Repository<TradeEntity>,
    @InjectRepository(TradingPositionEntity)
    private positionRepository: Repository<TradingPositionEntity>
  ) {
    this.initializeTrading();
  }

  private async initializeTrading() {
    this.logger.log('Инициализация PumpFun Trader...');

    // Загружаем открытые позиции из базы данных
    await this.loadOpenPositions();

    // Подписываемся на новые токены
    await this.subscribeToNewTokens();

    // Подписываемся на сделки
    await this.subscribeToTrades();

    this.logger.log('PumpFun Trader готов к работе');
  }

  // Загрузка открытых позиций из базы данных
  private async loadOpenPositions() {
    try {
      const dbPositions = await this.positionRepository.find({
        where: { status: 'open' },
        order: { createdAt: 'DESC' },
      });

      for (const dbPos of dbPositions) {
        const position: TradePosition = {
          id: dbPos.buySignature,
          mint: dbPos.mint,
          entryPrice: dbPos.entryPrice,
          amount: dbPos.tokenAmount,
          solInvested: dbPos.solInvested,
          timestamp: dbPos.createdAt,
          status: 'open',
        };

        this.positions.set(dbPos.mint, position);
        this.watchedTokens.add(dbPos.mint);
      }

      this.logger.log(
        `Загружено ${dbPositions.length} открытых позиций из базы данных`
      );
    } catch (error) {
      this.logger.error(`Ошибка загрузки позиций из БД: ${error.message}`);
    }
  }

  // Подписка на новые токены
  private async subscribeToNewTokens() {
    const subscription: SubscriptionRequest = {
      method: 'subscribeNewToken',
    };

    const success = await this.pumpPortalService.subscribe(subscription);
    if (success) {
      this.logger.log('Подписка на новые токены активирована');
    } else {
      this.logger.error('Ошибка подписки на новые токены');
    }
  }

  // Подписка на торговые события
  private async subscribeToTrades() {
    const subscription: SubscriptionRequest = {
      method: 'subscribeTokenTrade',
    };

    const success = await this.pumpPortalService.subscribe(subscription);
    if (success) {
      this.logger.log('Подписка на торговые события активирована');
    } else {
      this.logger.error('Ошибка подписки на торговые события');
    }
  }

  // Анализ нового токена
  async analyzeNewToken(tokenInfo: TokenInfo): Promise<boolean> {
    try {
      this.logger.log(
        `Анализ нового токена: ${tokenInfo.symbol} (${tokenInfo.mint})`
      );

      // Проверяем возраст токена
      const tokenAge = Date.now() - tokenInfo.createdAt.getTime();
      const ageInMinutes = tokenAge / (1000 * 60);

      if (ageInMinutes > this.defaultStrategy.maxAge) {
        this.logger.debug(
          `Токен ${tokenInfo.symbol} слишком старый: ${ageInMinutes.toFixed(1)} минут`
        );
        return false;
      }

      // Проверяем капитализацию
      if (
        tokenInfo.marketCap < this.defaultStrategy.minMarketCap ||
        tokenInfo.marketCap > this.defaultStrategy.maxMarketCap
      ) {
        this.logger.debug(
          `Токен ${tokenInfo.symbol} не подходит по капитализации: $${tokenInfo.marketCap}`
        );
        return false;
      }

      // Проверяем объем торгов
      if (tokenInfo.volume24h < this.defaultStrategy.minVolume24h) {
        this.logger.debug(
          `Токен ${tokenInfo.symbol} низкий объем торгов: $${tokenInfo.volume24h}`
        );
        return false;
      }

      // Получаем дополнительную статистику
      const stats = await this.pumpPortalService.getTokenStats(tokenInfo.mint);
      if (!stats) {
        this.logger.debug(
          `Не удалось получить статистику для ${tokenInfo.symbol}`
        );
        return false;
      }

      // Проверяем momentum (рост цены)
      if (stats.priceChange24h <= 0) {
        this.logger.debug(
          `Токен ${tokenInfo.symbol} без роста цены: ${stats.priceChange24h}%`
        );
        return false;
      }

      this.logger.log(
        `✅ Токен ${tokenInfo.symbol} прошел анализ: MC=$${tokenInfo.marketCap}, Vol=$${tokenInfo.volume24h}, Change=${stats.priceChange24h}%`
      );

      // Добавляем в список отслеживаемых
      this.watchedTokens.add(tokenInfo.mint);

      return true;
    } catch (error) {
      this.logger.error(
        `Ошибка анализа токена ${tokenInfo.mint}: ${error.message}`
      );
      return false;
    }
  }

  // Выполнение покупки
  async executeBuy(mint: string): Promise<string | null> {
    try {
      // Проверяем лимит позиций
      if (this.positions.size >= this.defaultStrategy.maxPositions) {
        this.logger.warn(
          `Достигнут лимит открытых позиций: ${this.defaultStrategy.maxPositions}`
        );
        return null;
      }

      // Проверяем, что позиция еще не открыта
      if (this.positions.has(mint)) {
        this.logger.debug(`Позиция по токену ${mint} уже открыта`);
        return null;
      }

      const tokenInfo = await this.pumpPortalService.getTokenInfo(mint);
      if (!tokenInfo) {
        this.logger.error(`Не удалось получить информацию о токене ${mint}`);
        return null;
      }

      this.logger.log(
        `🟢 Выполняю покупку ${tokenInfo.symbol} на ${this.defaultStrategy.buyAmount} SOL`
      );

      const tradeRequest: LightningTradeRequest = {
        action: 'buy',
        mint: mint,
        amount: this.defaultStrategy.buyAmount,
        denominatedInSol: true,
        slippage: this.defaultStrategy.slippage,
        priorityFee: this.defaultStrategy.priorityFee,
        pool: 'pump',
      };

      const result =
        await this.pumpPortalService.executeLightningTrade(tradeRequest);

      if (result.signature) {
        // Создаем позицию в памяти
        const position: TradePosition = {
          id: result.signature,
          mint: mint,
          entryPrice: tokenInfo.price,
          amount: this.defaultStrategy.buyAmount / tokenInfo.price, // примерное количество токенов
          solInvested: this.defaultStrategy.buyAmount,
          timestamp: new Date(),
          status: 'open',
        };

        this.positions.set(mint, position);

        // Сохраняем позицию в базу данных
        try {
          const dbPosition = new TradingPositionEntity();
          dbPosition.mint = mint;
          dbPosition.tokenName = tokenInfo.name;
          dbPosition.tokenSymbol = tokenInfo.symbol;
          dbPosition.entryPrice = tokenInfo.price;
          dbPosition.tokenAmount = position.amount;
          dbPosition.solInvested = this.defaultStrategy.buyAmount;
          dbPosition.buySignature = result.signature;
          dbPosition.stopLoss = this.defaultStrategy.stopLoss;
          dbPosition.takeProfit = this.defaultStrategy.takeProfit;
          dbPosition.slippage = this.defaultStrategy.slippage;
          dbPosition.priorityFee = this.defaultStrategy.priorityFee;
          dbPosition.strategy = this.defaultStrategy.name;

          await this.positionRepository.save(dbPosition);
        } catch (error) {
          this.logger.error(`Ошибка сохранения позиции в БД: ${error.message}`);
        }

        this.logger.log(
          `✅ Покупка выполнена: ${tokenInfo.symbol} по цене $${tokenInfo.price}, TX: ${result.signature}`
        );

        return result.signature;
      } else {
        this.logger.error(
          `Ошибка покупки ${tokenInfo.symbol}: ${result.error}`
        );
        return null;
      }
    } catch (error) {
      this.logger.error(`Критическая ошибка покупки ${mint}: ${error.message}`);
      return null;
    }
  }

  // Выполнение продажи
  async executeSell(mint: string, reason: string): Promise<string | null> {
    try {
      const position = this.positions.get(mint);
      if (!position) {
        this.logger.warn(`Позиция по токену ${mint} не найдена`);
        return null;
      }

      const tokenInfo = await this.pumpPortalService.getTokenInfo(mint);
      if (!tokenInfo) {
        this.logger.error(`Не удалось получить информацию о токене ${mint}`);
        return null;
      }

      this.logger.log(
        `🔴 Выполняю продажу ${tokenInfo.symbol}, причина: ${reason}`
      );

      const tradeRequest: LightningTradeRequest = {
        action: 'sell',
        mint: mint,
        amount: position.amount,
        denominatedInSol: false,
        slippage: this.defaultStrategy.slippage,
        priorityFee: this.defaultStrategy.priorityFee,
        pool: 'pump',
      };

      const result =
        await this.pumpPortalService.executeLightningTrade(tradeRequest);

      if (result.signature) {
        // Обновляем позицию
        const currentValue = position.amount * tokenInfo.price;
        const pnl = currentValue - position.solInvested;
        const pnlPercent = (pnl / position.solInvested) * 100;

        position.exitPrice = tokenInfo.price;
        position.pnl = pnl;
        position.status = reason.includes('stop')
          ? 'stop_loss'
          : reason.includes('profit')
            ? 'take_profit'
            : 'closed';

        // Обновляем позицию в базе данных
        try {
          const dbPosition = await this.positionRepository.findOne({
            where: { mint, status: 'open' },
          });

          if (dbPosition) {
            dbPosition.close(tokenInfo.price, result.signature, reason);
            await this.positionRepository.save(dbPosition);
          }
        } catch (error) {
          this.logger.error(`Ошибка обновления позиции в БД: ${error.message}`);
        }

        this.logger.log(
          `✅ Продажа выполнена: ${tokenInfo.symbol} по цене $${tokenInfo.price}, PnL: ${pnl.toFixed(4)} SOL (${pnlPercent.toFixed(2)}%), TX: ${result.signature}`
        );

        // Удаляем позицию
        this.positions.delete(mint);
        this.watchedTokens.delete(mint);

        return result.signature;
      } else {
        this.logger.error(
          `Ошибка продажи ${tokenInfo.symbol}: ${result.error}`
        );
        return null;
      }
    } catch (error) {
      this.logger.error(`Критическая ошибка продажи ${mint}: ${error.message}`);
      return null;
    }
  }

  // Проверка стоп-лоссов и тейк-профитов
  @Cron(CronExpression.EVERY_30_SECONDS)
  async checkPositions() {
    if (!this.isTrading || this.positions.size === 0) {
      return;
    }

    this.logger.debug(`Проверка ${this.positions.size} открытых позиций...`);

    for (const [mint, position] of this.positions.entries()) {
      try {
        const tokenInfo = await this.pumpPortalService.getTokenInfo(mint);
        if (!tokenInfo) {
          this.logger.warn(`Не удалось получить цену для позиции ${mint}`);
          continue;
        }

        const currentPrice = tokenInfo.price;
        const priceChange =
          ((currentPrice - position.entryPrice) / position.entryPrice) * 100;

        // Проверяем стоп-лосс
        if (priceChange <= -this.defaultStrategy.stopLoss) {
          this.logger.warn(
            `🛑 Сработал стоп-лосс для ${tokenInfo.symbol}: ${priceChange.toFixed(2)}%`
          );
          await this.executeSell(mint, 'stop_loss');
          continue;
        }

        // Проверяем тейк-профит
        if (priceChange >= this.defaultStrategy.takeProfit) {
          this.logger.log(
            `💰 Сработал тейк-профит для ${tokenInfo.symbol}: ${priceChange.toFixed(2)}%`
          );
          await this.executeSell(mint, 'take_profit');
          continue;
        }

        this.logger.debug(
          `Позиция ${tokenInfo.symbol}: ${priceChange.toFixed(2)}% (SL: -${this.defaultStrategy.stopLoss}%, TP: +${this.defaultStrategy.takeProfit}%)`
        );
      } catch (error) {
        this.logger.error(`Ошибка проверки позиции ${mint}: ${error.message}`);
      }
    }
  }

  // Сканирование рынка на новые возможности
  @Cron(CronExpression.EVERY_MINUTE)
  async scanMarket() {
    if (!this.isTrading) {
      return;
    }

    try {
      this.logger.debug('Сканирование рынка...');

      // Получаем последние токены
      const tokens = await this.pumpPortalService.getTokens(20, 0);

      for (const token of tokens) {
        // Пропускаем уже отслеживаемые токены
        if (
          this.watchedTokens.has(token.mint) ||
          this.positions.has(token.mint)
        ) {
          continue;
        }

        // Анализируем токен
        const shouldBuy = await this.analyzeNewToken(token);
        if (shouldBuy) {
          await this.executeBuy(token.mint);
          // Делаем паузу между покупками
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    } catch (error) {
      this.logger.error(`Ошибка сканирования рынка: ${error.message}`);
    }
  }

  // Управление трейдером
  async startTrading(): Promise<void> {
    this.isTrading = true;
    this.logger.log('🚀 Трейдер запущен');
  }

  async stopTrading(): Promise<void> {
    this.isTrading = false;
    this.logger.log('⏹️ Трейдер остановлен');
  }

  // Закрытие всех позиций
  async closeAllPositions(): Promise<void> {
    this.logger.log('Закрытие всех открытых позиций...');

    for (const mint of this.positions.keys()) {
      await this.executeSell(mint, 'manual_close');
      // Пауза между продажами
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    this.logger.log('Все позиции закрыты');
  }

  // Получение статистики
  async getTradingStats(): Promise<TradingStats> {
    try {
      const allPositions = await this.positionRepository.find({
        where: { strategy: this.defaultStrategy.name },
      });

      const closedPositions = allPositions.filter((p) => p.status !== 'open');
      const winTrades = closedPositions.filter((p) => p.pnl > 0).length;
      const loseTrades = closedPositions.filter((p) => p.pnl <= 0).length;

      const totalPnl = closedPositions.reduce(
        (sum, p) => sum + (p.pnl || 0),
        0
      );
      const totalVolume = allPositions.reduce(
        (sum, p) => sum + p.solInvested,
        0
      );

      const winRate =
        closedPositions.length > 0
          ? (winTrades / closedPositions.length) * 100
          : 0;

      const wins = closedPositions.filter((p) => p.pnl > 0);
      const losses = closedPositions.filter((p) => p.pnl <= 0);

      const avgWin =
        wins.length > 0
          ? wins.reduce((sum, p) => sum + p.pnl, 0) / wins.length
          : 0;
      const avgLoss =
        losses.length > 0
          ? losses.reduce((sum, p) => sum + p.pnl, 0) / losses.length
          : 0;

      const stats: TradingStats = {
        totalTrades: allPositions.length,
        winTrades,
        loseTrades,
        totalPnl,
        winRate,
        avgWin,
        avgLoss,
        maxDrawdown: 0, // TODO: реализовать расчет максимальной просадки
        totalVolume,
      };

      return stats;
    } catch (error) {
      this.logger.error(`Ошибка получения статистики: ${error.message}`);
      return {
        totalTrades: 0,
        winTrades: 0,
        loseTrades: 0,
        totalPnl: 0,
        winRate: 0,
        avgWin: 0,
        avgLoss: 0,
        maxDrawdown: 0,
        totalVolume: 0,
      };
    }
  }

  // Получение открытых позиций
  getOpenPositions(): TradePosition[] {
    return Array.from(this.positions.values());
  }

  // Получение настроек стратегии
  getStrategy(): TradingStrategy {
    return this.defaultStrategy;
  }

  // Обновление настроек стратегии
  updateStrategy(strategy: Partial<TradingStrategy>): void {
    Object.assign(this.defaultStrategy, strategy);
    this.logger.log('Настройки стратегии обновлены');
  }

  // Получение статуса трейдера
  getStatus() {
    return {
      isTrading: this.isTrading,
      openPositions: this.positions.size,
      watchedTokens: this.watchedTokens.size,
      strategy: this.defaultStrategy,
      uptime: process.uptime(),
    };
  }
}
