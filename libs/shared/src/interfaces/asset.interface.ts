export interface BalanceAsset {
  assetInfo: Asset;
  amount: number;
  valueInCurrency?: number;
}

export interface Asset {
  id: number;
  search_id: string;
  symbol: string;
  name: string;
}

export interface CoinGeckoApiAssetResponse {
  id: string;
  symbol: string;
  name: string;
}
