import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('trading_positions')
@Index(['mint'])
@Index(['status'])
@Index(['createdAt'])
export class TradingPositionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 44 })
  @Index()
  mint: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  tokenName: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  tokenSymbol: string;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  entryPrice: number;

  @Column({ type: 'decimal', precision: 18, scale: 8, nullable: true })
  exitPrice: number;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  tokenAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 6 })
  solInvested: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  solReceived: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  pnl: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  pnlPercent: number;

  @Column({
    type: 'enum',
    enum: ['open', 'closed', 'stop_loss', 'take_profit'],
    default: 'open',
  })
  @Index()
  status: 'open' | 'closed' | 'stop_loss' | 'take_profit';

  @Column({ type: 'varchar', length: 100, nullable: true })
  buySignature: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sellSignature: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  closeReason: string; // stop_loss, take_profit, manual_close, etc.

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  stopLoss: number; // в процентах

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  takeProfit: number; // в процентах

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  slippage: number; // в процентах

  @Column({ type: 'decimal', precision: 8, scale: 6 })
  priorityFee: number; // в SOL

  @Column({ type: 'varchar', length: 50 })
  strategy: string; // название стратегии

  @Column({ type: 'timestamptz', nullable: true })
  closedAt: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // Вычисляемые поля
  get duration(): number {
    const endTime = this.closedAt || new Date();
    return endTime.getTime() - this.createdAt.getTime();
  }

  get durationMinutes(): number {
    return Math.floor(this.duration / (1000 * 60));
  }

  get isOpen(): boolean {
    return this.status === 'open';
  }

  get isProfitable(): boolean {
    return this.pnl > 0;
  }

  // Методы для обновления позиции
  updatePrice(currentPrice: number): void {
    const currentValue = this.tokenAmount * currentPrice;
    this.pnl = currentValue - this.solInvested;
    this.pnlPercent = (this.pnl / this.solInvested) * 100;
  }

  close(exitPrice: number, signature: string, reason: string): void {
    this.exitPrice = exitPrice;
    this.sellSignature = signature;
    this.closeReason = reason;
    this.closedAt = new Date();

    const currentValue = this.tokenAmount * exitPrice;
    this.solReceived = currentValue;
    this.pnl = currentValue - this.solInvested;
    this.pnlPercent = (this.pnl / this.solInvested) * 100;

    // Обновляем статус в зависимости от причины закрытия
    if (reason.includes('stop')) {
      this.status = 'stop_loss';
    } else if (reason.includes('profit')) {
      this.status = 'take_profit';
    } else {
      this.status = 'closed';
    }
  }
}
