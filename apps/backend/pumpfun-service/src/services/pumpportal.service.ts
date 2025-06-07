import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios, { AxiosInstance } from 'axios';
import * as WebSocket from 'ws';
import { TokenEntity } from '../entities/token.entity';
import { TradeEntity } from '../entities/trade.entity';
import {
  LightningTradeRequest,
  LightningTradeResponse,
  LocalTradeRequest,
  WebSocketEvent,
  TokenInfo,
  TradeInfo,
  TokenStats,
  SubscriptionRequest,
  UnsubscriptionRequest,
} from '../interfaces/pumpportal.interface';

@Injectable()
export class PumpPortalService {
  private readonly logger = new Logger(PumpPortalService.name);
  private readonly apiClient: AxiosInstance;
  private websocket: WebSocket;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnected = false;

  constructor(
    private configService: ConfigService,
    @InjectRepository(TokenEntity)
    private tokenRepository: Repository<TokenEntity>,
    @InjectRepository(TradeEntity)
    private tradeRepository: Repository<TradeEntity>
  ) {
    this.apiClient = axios.create({
      baseURL: this.configService.get('PUMPPORTAL_BASE_URL'),
      timeout: 30000,
    });

    this.initializeWebSocket();
  }

  // Lightning Transaction API - быстрые сделки через PumpPortal
  async executeLightningTrade(
    request: LightningTradeRequest
  ): Promise<LightningTradeResponse> {
    try {
      const apiKey = this.configService.get('PUMPPORTAL_API_KEY');
      if (!apiKey) {
        throw new Error('API ключ PumpPortal не настроен');
      }

      this.logger.log(`Выполняю ${request.action} для токена ${request.mint}`);

      const response = await this.apiClient.post(
        `/trade?api-key=${apiKey}`,
        request
      );

      if (response.data.signature) {
        this.logger.log(`Сделка успешно выполнена: ${response.data.signature}`);
        return { signature: response.data.signature };
      } else {
        this.logger.error(`Ошибка выполнения сделки: ${response.data.error}`);
        return { error: response.data.error };
      }
    } catch (error) {
      this.logger.error(`Ошибка Lightning Trade: ${error.message}`);
      return { error: error.message };
    }
  }

  // Local Transaction API - создание транзакции для локального подписания
  async createLocalTransaction(
    request: LocalTradeRequest
  ): Promise<ArrayBuffer> {
    try {
      this.logger.log(
        `Создаю локальную транзакцию ${request.action} для токена ${request.mint}`
      );

      const response = await this.apiClient.post('/trade-local', request, {
        responseType: 'arraybuffer',
      });

      return response.data;
    } catch (error) {
      this.logger.error(
        `Ошибка создания локальной транзакции: ${error.message}`
      );
      throw error;
    }
  }

  // WebSocket подключение и подписки
  private initializeWebSocket() {
    const wsUrl = this.configService.get('PUMPPORTAL_WS_URL');
    this.websocket = new WebSocket(wsUrl);

    this.websocket.on('open', () => {
      this.logger.log('WebSocket подключение установлено');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.websocket.on('message', (data) => {
      try {
        const event: WebSocketEvent = JSON.parse(data.toString());
        this.handleWebSocketEvent(event);
      } catch (error) {
        this.logger.error(
          `Ошибка обработки WebSocket сообщения: ${error.message}`
        );
      }
    });

    this.websocket.on('close', () => {
      this.logger.warn('WebSocket подключение закрыто');
      this.isConnected = false;
      this.attemptReconnect();
    });

    this.websocket.on('error', (error) => {
      this.logger.error(`WebSocket ошибка: ${error.message}`);
      this.isConnected = false;
    });
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      this.logger.log(
        `Попытка переподключения ${this.reconnectAttempts}/${this.maxReconnectAttempts}`
      );

      setTimeout(() => {
        this.initializeWebSocket();
      }, 5000 * this.reconnectAttempts);
    } else {
      this.logger.error(
        'Максимальное количество попыток переподключения достигнуто'
      );
    }
  }

  // Подписка на события
  async subscribe(request: SubscriptionRequest): Promise<boolean> {
    if (!this.isConnected) {
      this.logger.error('WebSocket не подключен');
      return false;
    }

    try {
      this.websocket.send(JSON.stringify(request));
      this.logger.log(`Подписка на ${request.method} активирована`);
      return true;
    } catch (error) {
      this.logger.error(`Ошибка подписки: ${error.message}`);
      return false;
    }
  }

  // Отписка от событий
  async unsubscribe(request: UnsubscriptionRequest): Promise<boolean> {
    if (!this.isConnected) {
      this.logger.error('WebSocket не подключен');
      return false;
    }

    try {
      this.websocket.send(JSON.stringify(request));
      this.logger.log(`Отписка от ${request.method} выполнена`);
      return true;
    } catch (error) {
      this.logger.error(`Ошибка отписки: ${error.message}`);
      return false;
    }
  }

  // Обработка WebSocket событий
  private async handleWebSocketEvent(event: WebSocketEvent) {
    switch (event.method) {
      case 'tokenCreated':
        await this.handleTokenCreation(event.data);
        break;
      case 'tokenTrade':
        await this.handleTokenTrade(event.data);
        break;
      case 'accountTrade':
        await this.handleAccountTrade(event.data);
        break;
      case 'migration':
        await this.handleMigration(event.data);
        break;
      default:
        this.logger.warn(`Неизвестный тип события: ${event}`);
    }
  }

  // Обработка создания токена
  private async handleTokenCreation(data: any) {
    try {
      const token = new TokenEntity();
      token.mint = data.mint;
      token.name = data.name || '';
      token.symbol = data.symbol || '';
      token.description = data.description || '';
      token.image = data.image || '';
      token.dev = data.dev || '';
      token.supply = data.supply || '1000000000000000';
      token.marketCap = data.marketCap || 0;
      token.price = 0;
      token.volume24h = 0;
      token.holders = 0;
      token.totalTrades = 0;
      token.isGraduated = false;

      await this.tokenRepository.save(token);
      this.logger.log(`Новый токен сохранен: ${data.symbol} (${data.mint})`);
    } catch (error) {
      this.logger.error(`Ошибка сохранения токена: ${error.message}`);
    }
  }

  // Обработка сделки с токеном
  private async handleTokenTrade(data: any) {
    try {
      const trade = new TradeEntity();
      trade.signature = data.signature;
      trade.mint = data.mint;
      trade.trader = data.traderPublicKey;
      trade.type = data.txType;
      trade.solAmount = data.sol;
      trade.tokenAmount = data.tokenAmount;
      trade.price = data.sol / parseFloat(data.tokenAmount);
      trade.bondingCurveKey = data.bondingCurveKey;
      trade.newTokenReserves = data.newTokenReserves;
      trade.newSolReserves = data.newSolReserves;

      await this.tradeRepository.save(trade);

      // Обновляем статистику токена
      await this.updateTokenStats(data.mint);

      this.logger.log(
        `Сделка сохранена: ${data.txType} ${data.tokenAmount} токенов за ${data.sol} SOL`
      );
    } catch (error) {
      this.logger.error(`Ошибка сохранения сделки: ${error.message}`);
    }
  }

  // Обработка сделки аккаунта
  private async handleAccountTrade(data: any) {
    this.logger.log(
      `Сделка аккаунта: ${data.account} ${data.txType} ${data.mint}`
    );
    // Дополнительная логика для отслеживания конкретных аккаунтов
  }

  // Обработка миграции токена в Raydium
  private async handleMigration(data: any) {
    try {
      await this.tokenRepository.update(
        { mint: data.mint },
        { isGraduated: true }
      );
      this.logger.log(`Токен ${data.symbol} мигрировал в Raydium`);
    } catch (error) {
      this.logger.error(`Ошибка обновления миграции: ${error.message}`);
    }
  }

  // Обновление статистики токена
  private async updateTokenStats(mint: string) {
    try {
      const trades = await this.tradeRepository.find({
        where: { mint },
        order: { timestamp: 'DESC' },
        take: 100,
      });

      if (trades.length > 0) {
        const latestTrade = trades[0];
        const volume24h = trades.reduce(
          (sum, trade) => sum + trade.solAmount,
          0
        );
        const totalTrades = await this.tradeRepository.count({
          where: { mint },
        });

        await this.tokenRepository.update(mint, {
          price: latestTrade.price,
          volume24h,
          totalTrades,
          marketCap: latestTrade.price * 1000000000, // 1B токенов
        });
      }
    } catch (error) {
      this.logger.error(
        `Ошибка обновления статистики токена: ${error.message}`
      );
    }
  }

  // Получение информации о токене
  async getTokenInfo(mint: string): Promise<TokenInfo | null> {
    try {
      const token = await this.tokenRepository.findOne({ where: { mint } });
      if (!token) return null;

      return {
        mint: token.mint,
        name: token.name,
        symbol: token.symbol,
        description: token.description,
        image: token.image,
        dev: token.dev,
        createdAt: token.createdAt,
        supply: token.supply,
        marketCap: token.marketCap,
        price: token.price,
        volume24h: token.volume24h,
        holders: token.holders,
        isGraduated: token.isGraduated,
        raydiumPool: token.raydiumPool,
      };
    } catch (error) {
      this.logger.error(
        `Ошибка получения информации о токене: ${error.message}`
      );
      return null;
    }
  }

  // Получение статистики токена
  async getTokenStats(mint: string): Promise<TokenStats | null> {
    try {
      const token = await this.tokenRepository.findOne({ where: { mint } });
      if (!token) return null;

      const trades24h = await this.tradeRepository.find({
        where: {
          mint,
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      });

      const buyTrades24h = trades24h.filter((t) => t.type === 'buy').length;
      const sellTrades24h = trades24h.filter((t) => t.type === 'sell').length;

      // Получение топ холдеров (в реальном проекте потребуется дополнительная логика)
      const topHolders = [];

      return {
        mint: token.mint,
        price: token.price,
        priceChange24h: 0, // Требуется расчет на основе исторических данных
        volume24h: token.volume24h,
        marketCap: token.marketCap,
        holders: token.holders,
        totalTrades: token.totalTrades,
        buyTrades24h,
        sellTrades24h,
        topHolders,
      };
    } catch (error) {
      this.logger.error(`Ошибка получения статистики токена: ${error.message}`);
      return null;
    }
  }

  // Получение списка токенов
  async getTokens(
    limit: number = 10,
    offset: number = 0
  ): Promise<TokenInfo[]> {
    try {
      const tokens = await this.tokenRepository.find({
        order: { marketCap: 'DESC' },
        take: limit,
        skip: offset,
      });

      return tokens.map((token) => ({
        mint: token.mint,
        name: token.name,
        symbol: token.symbol,
        description: token.description,
        image: token.image,
        dev: token.dev,
        createdAt: token.createdAt,
        supply: token.supply,
        marketCap: token.marketCap,
        price: token.price,
        volume24h: token.volume24h,
        holders: token.holders,
        isGraduated: token.isGraduated,
        raydiumPool: token.raydiumPool,
      }));
    } catch (error) {
      this.logger.error(`Ошибка получения списка токенов: ${error.message}`);
      return [];
    }
  }

  // Получение последних сделок
  async getLatestTrades(
    mint?: string,
    limit: number = 10
  ): Promise<TradeInfo[]> {
    try {
      const whereCondition = mint ? { mint } : {};
      const trades = await this.tradeRepository.find({
        where: whereCondition,
        order: { timestamp: 'DESC' },
        take: limit,
      });

      return trades.map((trade) => ({
        signature: trade.signature,
        mint: trade.mint,
        trader: trade.trader,
        type: trade.type,
        solAmount: trade.solAmount,
        tokenAmount: trade.tokenAmount,
        price: trade.price,
        timestamp: trade.timestamp,
        bondingCurveKey: trade.bondingCurveKey,
        newTokenReserves: trade.newTokenReserves,
        newSolReserves: trade.newSolReserves,
      }));
    } catch (error) {
      this.logger.error(`Ошибка получения сделок: ${error.message}`);
      return [];
    }
  }
}
