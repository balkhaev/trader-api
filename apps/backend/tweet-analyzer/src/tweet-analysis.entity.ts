import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('tweet_analysis')
export class TweetAnalysisEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  tweetId: string;

  @Column('text')
  text: string;

  @Column('jsonb')
  analysisResult: any;

  @CreateDateColumn()
  createdAt: Date;
}
