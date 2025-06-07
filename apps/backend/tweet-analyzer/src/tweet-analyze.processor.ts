import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { AppService } from './app.service';
import { aiService } from 'utils/ai-service';

@Processor('tweet-analyze')
export class TweetAnalyzeProcessor {
  constructor(private readonly appService: AppService) {}

  @Process()
  async handleAnalyze(job: Job<{ tweetId: string; text: string }>) {
    const { tweetId, text } = job.data;
    const { data } = await aiService.post('/analyze/tweet', { query: text });

    await this.appService.saveAnalysis(tweetId, text, data);

    return data;
  }
}
