export function generateRateCacheKey(
  assetId: string,
  currency: string,
): string {
  return `rate:${assetId}_${currency}`;
}

export function generateRevokedTokenCacheKey(tokenId: string): string {
  return `revokedToken:${tokenId}`;
}
