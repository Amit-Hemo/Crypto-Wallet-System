import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  ValueTransformer,
} from 'typeorm';
import { Asset } from './Asset';

class DecimalColumnTransformer implements ValueTransformer {
  to(value: number): number {
    return value;
  }
  from(value: string): number {
    return parseFloat(value);
  }
}

@Entity()
export class Balance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column()
  asset_id: number;

  @ManyToOne(() => Asset)
  @JoinColumn({ name: 'asset_id' })
  asset: Asset;

  @Column('decimal', {
    precision: 5,
    scale: 2,
    transformer: new DecimalColumnTransformer(),
  })
  amount: number;
}
