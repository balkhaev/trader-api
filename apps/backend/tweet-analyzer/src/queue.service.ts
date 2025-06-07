import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue('tweet-analyze')
    private readonly analyzeQueue: Queue,
  ) {}

  async addTweetToAnalyze(tweetId: string, text: string) {
    return this.analyzeQueue.add({ tweetId, text });
  }
}
