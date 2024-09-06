export interface CoinGeckoApiRateResponse {
  [assetId: string]: {
    [currency: string]: number;
  };
}
