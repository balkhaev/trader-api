import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TweetAnalysisEntity } from './tweet-analysis.entity';
import { TweetAnalyzeProcessor } from './tweet-analyze.processor';
import { QueueService } from './queue.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASS || 'postgres',
      database: process.env.DB_NAME || 'tweet_analyzer',
      autoLoadEntities: true,
      synchronize: true, // В проде лучше false
    }),
    TypeOrmModule.forFeature([TweetAnalysisEntity]),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
    BullModule.registerQueue({
      name: 'tweet-analyze',
    }),
  ],
  controllers: [AppController],
  providers: [AppService, TweetAnalyzeProcessor, QueueService],
  exports: [AppService],
})
export class AppModule {}
