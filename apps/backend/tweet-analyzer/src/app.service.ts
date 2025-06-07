import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TweetAnalysisEntity } from './tweet-analysis.entity';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(TweetAnalysisEntity)
    private readonly tweetRepo: Repository<TweetAnalysisEntity>,
  ) {}

  async saveAnalysis(tweetId: string, text: string, analysisResult: any) {
    const entity = this.tweetRepo.create({ tweetId, text, analysisResult });
    return this.tweetRepo.save(entity);
  }

  async getAnalysis(tweetId: string) {
    return this.tweetRepo.findOne({ where: { tweetId } });
  }

  async getAllAnalyses() {
    return this.tweetRepo.find();
  }
}
