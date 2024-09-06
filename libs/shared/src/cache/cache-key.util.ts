export function generateCacheKey(assetId: string, currency: string): string {
  return `rate:${assetId}_${currency}`;
}
