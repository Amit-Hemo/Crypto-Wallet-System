import { Cached } from './cached.interface';

export interface CoinGeckoApiRateResponse {
  [assetId: string]: {
    [currency: string]: number;
  };
}

export interface Rate extends Cached {
  rate: number;
}
