import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { TradeEntity } from './trade.entity';

@Entity('tokens')
export class TokenEntity {
  @PrimaryColumn()
  mint: string;

  @Column()
  name: string;

  @Column()
  symbol: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ nullable: true })
  image: string;

  @Column()
  dev: string;

  @Column('bigint')
  supply: string;

  @Column('decimal', { precision: 20, scale: 8, default: 0 })
  marketCap: number;

  @Column('decimal', { precision: 20, scale: 12, default: 0 })
  price: number;

  @Column('decimal', { precision: 20, scale: 8, default: 0 })
  volume24h: number;

  @Column('int', { default: 0 })
  holders: number;

  @Column('int', { default: 0 })
  totalTrades: number;

  @Column('boolean', { default: false })
  isGraduated: boolean;

  @Column({ nullable: true })
  raydiumPool: string;

  @Column({ nullable: true })
  bondingCurveKey: string;

  @Column('bigint', { nullable: true })
  tokenReserves: string;

  @Column('bigint', { nullable: true })
  solReserves: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => TradeEntity, (trade) => trade.token)
  trades: TradeEntity[];
}
