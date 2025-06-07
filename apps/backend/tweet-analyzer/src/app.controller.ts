import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { QueueService } from './queue.service';

@Controller('analysis')
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly queueService: QueueService,
  ) {}

  @Get()
  getAll() {
    return this.appService.getAllAnalyses();
  }

  @Get(':tweetId')
  getOne(@Param('tweetId') tweetId: string) {
    return this.appService.getAnalysis(tweetId);
  }

  // Для теста: ручное сохранение анализа
  @Post()
  save(@Body() body: { tweetId: string; text: string; analysisResult: any }) {
    return this.appService.saveAnalysis(
      body.tweetId,
      body.text,
      body.analysisResult,
    );
  }

  // Добавить твит в очередь анализа
  @Post('enqueue')
  enqueue(@Body() body: { tweetId: string; text: string }) {
    return this.queueService.addTweetToAnalyze(body.tweetId, body.text);
  }
}
