import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Asset {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  search_id: string;

  @Column()
  name: string;

  @Column()
  symbol: string;
}
