import { CryptoAsset } from './asset.interface';

export interface UserBalance {
  userId: string;
  assets: CryptoAsset[];
}
