import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { PumpPortalService } from '../services/pumpportal.service';
import { SubscribeDto, UnsubscribeDto } from '../dto/trade.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/pumpportal',
})
export class PumpPortalGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(PumpPortalGateway.name);
  private clientSubscriptions = new Map<string, Set<string>>();

  constructor(private readonly pumpPortalService: PumpPortalService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Клиент подключился: ${client.id}`);
    this.clientSubscriptions.set(client.id, new Set());

    // Отправляем приветственное сообщение
    client.emit('connected', {
      message: 'Подключение к PumpPortal WebSocket установлено',
      clientId: client.id,
      timestamp: new Date().toISOString(),
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Клиент отключился: ${client.id}`);

    // Очищаем подписки клиента
    const subscriptions = this.clientSubscriptions.get(client.id);
    if (subscriptions) {
      subscriptions.forEach((subscription) => {
        this.logger.log(
          `Удаляю подписку ${subscription} для клиента ${client.id}`
        );
      });
      this.clientSubscriptions.delete(client.id);
    }
  }

  @SubscribeMessage('subscribe')
  async handleSubscribe(
    @MessageBody() data: SubscribeDto,
    @ConnectedSocket() client: Socket
  ) {
    try {
      this.logger.log(`Клиент ${client.id} подписывается на ${data.method}`);

      // Подписываемся на PumpPortal WebSocket
      const success = await this.pumpPortalService.subscribe({
        method: data.method,
        keys: data.keys,
      });

      if (success) {
        // Сохраняем подписку клиента
        const clientSubs = this.clientSubscriptions.get(client.id);
        const subscriptionKey = `${data.method}:${data.keys?.join(',')}`;
        clientSubs?.add(subscriptionKey);

        client.emit('subscribed', {
          success: true,
          method: data.method,
          keys: data.keys,
          message: `Подписка на ${data.method} активирована`,
          timestamp: new Date().toISOString(),
        });

        this.logger.log(
          `Подписка ${subscriptionKey} активирована для клиента ${client.id}`
        );
      } else {
        client.emit('subscribed', {
          success: false,
          method: data.method,
          error: 'Не удалось активировать подписку',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      this.logger.error(`Ошибка подписки: ${error.message}`);
      client.emit('subscribed', {
        success: false,
        method: data.method,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @SubscribeMessage('unsubscribe')
  async handleUnsubscribe(
    @MessageBody() data: UnsubscribeDto,
    @ConnectedSocket() client: Socket
  ) {
    try {
      this.logger.log(`Клиент ${client.id} отписывается от ${data.method}`);

      // Отписываемся от PumpPortal WebSocket
      const success = await this.pumpPortalService.unsubscribe({
        method: data.method,
        keys: data.keys,
      });

      if (success) {
        // Удаляем подписку клиента
        const clientSubs = this.clientSubscriptions.get(client.id);
        const subscriptionKey = `${data.method}:${data.keys?.join(',')}`;
        clientSubs?.delete(subscriptionKey);

        client.emit('unsubscribed', {
          success: true,
          method: data.method,
          keys: data.keys,
          message: `Отписка от ${data.method} выполнена`,
          timestamp: new Date().toISOString(),
        });

        this.logger.log(
          `Отписка ${subscriptionKey} выполнена для клиента ${client.id}`
        );
      } else {
        client.emit('unsubscribed', {
          success: false,
          method: data.method,
          error: 'Не удалось выполнить отписку',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      this.logger.error(`Ошибка отписки: ${error.message}`);
      client.emit('unsubscribed', {
        success: false,
        method: data.method,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @SubscribeMessage('getTokenInfo')
  async handleGetTokenInfo(
    @MessageBody() data: { mint: string },
    @ConnectedSocket() client: Socket
  ) {
    try {
      const tokenInfo = await this.pumpPortalService.getTokenInfo(data.mint);

      client.emit('tokenInfo', {
        success: true,
        mint: data.mint,
        data: tokenInfo,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      client.emit('tokenInfo', {
        success: false,
        mint: data.mint,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @SubscribeMessage('getLatestTrades')
  async handleGetLatestTrades(
    @MessageBody() data: { mint?: string; limit?: number },
    @ConnectedSocket() client: Socket
  ) {
    try {
      const trades = await this.pumpPortalService.getLatestTrades(
        data.mint,
        data.limit || 10
      );

      client.emit('latestTrades', {
        success: true,
        mint: data.mint,
        data: trades,
        count: trades.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      client.emit('latestTrades', {
        success: false,
        mint: data.mint,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Методы для трансляции данных от PumpPortal ко всем подключенным клиентам
  broadcastTokenCreation(data: any) {
    this.server.emit('tokenCreated', {
      method: 'tokenCreated',
      data,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`Транслирован новый токен: ${data.symbol} (${data.mint})`);
  }

  broadcastTokenTrade(data: any) {
    this.server.emit('tokenTrade', {
      method: 'tokenTrade',
      data,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`Транслирована сделка: ${data.txType} ${data.mint}`);
  }

  broadcastAccountTrade(data: any) {
    this.server.emit('accountTrade', {
      method: 'accountTrade',
      data,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`Транслирована сделка аккаунта: ${data.account}`);
  }

  broadcastMigration(data: any) {
    this.server.emit('migration', {
      method: 'migration',
      data,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`Транслирована миграция: ${data.symbol} (${data.mint})`);
  }

  // Получение статистики подключений
  getConnectionStats() {
    const totalConnections = this.server.sockets.sockets.size;
    const totalSubscriptions = Array.from(
      this.clientSubscriptions.values()
    ).reduce((total, subs) => total + subs.size, 0);

    return {
      totalConnections,
      totalSubscriptions,
      timestamp: new Date().toISOString(),
    };
  }
}
