import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';

// Entities
import { TokenEntity } from './entities/token.entity';
import { TradeEntity } from './entities/trade.entity';
import { TradingPositionEntity } from './entities/trading-position.entity';

// Services
import { PumpPortalService } from './services/pumpportal.service';
import { PumpFunTraderService } from './services/pumpfun-trader.service';

// Controllers
import { TradingController } from './controllers/trading.controller';
import { TraderController } from './controllers/trader.controller';

// Gateways
import { PumpPortalGateway } from './gateways/pumpportal.gateway';

// Processors
import { TokenProcessor } from './processors/token.processor';

// Health Controller для мониторинга
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      service: 'pumpportal-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get('detailed')
  detailedCheck() {
    return {
      status: 'ok',
      service: 'pumpportal-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version,
      platform: process.platform,
    };
  }
}

@Module({
  imports: [
    // Конфигурация
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // База данных PostgreSQL
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST', 'localhost'),
        port: parseInt(configService.get('DATABASE_PORT', '5432')),
        username: configService.get('DATABASE_USERNAME', 'postgres'),
        password: configService.get('DATABASE_PASSWORD', 'password'),
        database: configService.get('DATABASE_NAME', 'pumpportal_db'),
        entities: [TokenEntity, TradeEntity, TradingPositionEntity],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
        retryAttempts: 3,
        retryDelay: 3000,
      }),
      inject: [ConfigService],
    }),

    // Регистрация сущностей в TypeORM
    TypeOrmModule.forFeature([TokenEntity, TradeEntity, TradingPositionEntity]),

    // Redis и Bull для очередей
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: parseInt(configService.get('REDIS_PORT', '6379')),
          password: configService.get('REDIS_PASSWORD') || undefined,
        },
      }),
      inject: [ConfigService],
    }),

    // Очереди для обработки данных
    BullModule.registerQueue({
      name: 'token-processing',
    }),
    BullModule.registerQueue({
      name: 'trade-processing',
    }),

    // Планировщик задач
    ScheduleModule.forRoot(),
  ],

  controllers: [TradingController, TraderController, HealthController],

  providers: [
    PumpPortalService,
    PumpFunTraderService,
    PumpPortalGateway,
    TokenProcessor,
  ],

  exports: [PumpPortalService, PumpFunTraderService],
})
export class AppModule {}
