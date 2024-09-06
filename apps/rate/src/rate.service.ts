import { AppLoggerService } from '@app/shared';
import { generateCacheKey } from '@app/shared/cache/cache-key.util';
import { TTlTimes } from '@app/shared/cache/ttl-times';
import {
  CoinGeckoApiRateResponse,
  Rate,
  RatesResponse,
} from '@app/shared/interfaces/rate.interface';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom, throwError } from 'rxjs';

@Injectable()
export class RateService {
  constructor(
    private readonly logger: AppLoggerService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.logger.setContext(RateService.name);
  }

  async getCryptoRate(
    assetIds: string[],
    currency: string,
  ): Promise<RatesResponse> {
    const response: RatesResponse = {
      rates: [],
      currency,
      cached: 'none',
    };

    const { staleAssetIds, cachedResults } = await this.lookupCache(
      assetIds,
      currency,
    );
    response.rates.push(...cachedResults);
    if (cachedResults.length === assetIds.length) {
      response.cached = 'all';
      return response;
    } else if (cachedResults.length > 0) {
      response.cached = 'partial';
    }

    const fetchResults = await this.fetchRates(staleAssetIds, currency);

    if (fetchResults.length === 0 && cachedResults.length === 0) {
      this.logger.error(`Invalid currency or no results for all given assets`);
      throw new RpcException(
        new BadRequestException('Invalid get rates request'),
      );
    }
    if (fetchResults.length < staleAssetIds.length) {
      this.logger.warn(
        `Successful fetch but some assets are invalid here and hence omitted.`,
      );
    }
    response.rates.push(...fetchResults);
    await this.cacheFreshResults(fetchResults, currency);

    return response;
  }

  private async fetchRates(
    assetIds: string[],
    currency: string,
  ): Promise<Rate[]> {
    const apiKey = this.configService.get<string>('COINGECKO_API_KEY');
    const requestUrl = this.generateRequestURL(assetIds, currency);

    const { data } = await firstValueFrom(
      this.httpService
        .get<CoinGeckoApiRateResponse>(requestUrl, {
          headers: {
            'x-cg-demo-api-key': apiKey,
          },
        })
        .pipe(
          catchError((error: AxiosError) => {
            this.logger.error(
              `External coinGecko api error: ${error.toJSON()}`,
            );
            return throwError(
              () =>
                new RpcException(
                  'An error happened when connection to coin gecko API',
                ),
            );
          }),
        ),
    );

    const message = `Successfully fetched rates for currency ${currency} from CoinGeckoAPI`;
    this.logger.log(message);

    const fetchedResults: Rate[] = [];
    for (const [assetId, rateCurrencyPair] of Object.entries(data)) {
      const isEmpty = Object.keys(rateCurrencyPair).length === 0;
      //NOTE: CoinGecko API omits Rate-Curreny pairs inside for every asset when currency is invalid, so I stop here
      if (isEmpty) break;
      fetchedResults.push({ [assetId]: rateCurrencyPair[currency] });
    }
    return fetchedResults;
  }

  private async lookupCache(
    assetIds: string[],
    currency: string,
  ): Promise<{ staleAssetIds: string[]; cachedResults: Rate[] }> {
    const staleAssetIds: string[] = [];
    const cachedResults: Rate[] = [];

    for (const id of assetIds) {
      const cacheKey = generateCacheKey(id, currency);
      try {
        const cachedRate = await this.cacheManager.get<number>(cacheKey);
        if (cachedRate) {
          cachedResults.push({ [id]: cachedRate });
        } else {
          staleAssetIds.push(id);
        }
      } catch (error) {
        this.logger.warn(
          `Failed to get rate for assetId ${id} and currency ${currency} from cache, will fetch from API: ${error}`,
        );
        staleAssetIds.push(id);
      }
    }
    return { staleAssetIds, cachedResults };
  }

  private async cacheFreshResults(fetchResults: Rate[], currency: string) {
    for (const data of fetchResults) {
      const assetId = Object.keys(data)[0];
      const rate = Object.values(data)[0];
      const cacheKey = generateCacheKey(assetId, currency);
      try {
        await this.cacheManager.set(cacheKey, rate, TTlTimes.MINUTE);
      } catch (error) {
        this.logger.warn(
          `Failed to update cache with rate for assetId ${assetId} and currency ${currency}: ${error}`,
        );
      }
    }
    this.logger.log(`Updated cache with the fresh values`);
  }

  private generateRequestURL(assetIds: string[], currency: string): string {
    const requestAssetIds = assetIds.join(',');
    return `https://api.coingecko.com/api/v3/simple/price?ids=${requestAssetIds}&vs_currencies=${currency}&precision=2`;
  }
}
