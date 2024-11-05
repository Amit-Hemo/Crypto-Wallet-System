import { BalanceAsset } from './asset.interface';

export interface UserBalance {
  userId: number;
  assets: BalanceAsset[];
}
