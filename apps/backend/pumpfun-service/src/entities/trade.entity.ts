import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm"
import { TokenEntity } from "./token.entity"

@Entity("trades")
export class TradeEntity {
  @PrimaryColumn()
  signature: string

  @Column()
  mint: string

  @Column()
  trader: string

  @Column({ type: "enum", enum: ["buy", "sell"] })
  type: "buy" | "sell"

  @Column("decimal", { precision: 20, scale: 9 })
  solAmount: number

  @Column("bigint")
  tokenAmount: string

  @Column("decimal", { precision: 20, scale: 12 })
  price: number

  @Column()
  bondingCurveKey: string

  @Column("bigint")
  newTokenReserves: string

  @Column("bigint")
  newSolReserves: string

  @CreateDateColumn()
  timestamp: Date

  @ManyToOne(() => TokenEntity, (token) => token.trades)
  @JoinColumn({ name: "mint" })
  token: TokenEntity
}
