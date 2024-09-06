type CacheStatus = 'all' | 'partial' | 'none';

export interface CoinGeckoApiRateResponse {
  [assetId: string]: {
    [currency: string]: number;
  };
}

export type Rate = Record<string, number>;

export interface RatesResponse {
  currency: string;
  rates: Rate[];
  cached: CacheStatus;
}
