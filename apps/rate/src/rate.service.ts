import { AppLoggerService } from '@app/shared';
import { generateCacheKey } from '@app/shared/cache/cache-key.util';
import { TTlTimes } from '@app/shared/cache/ttl-times';
import {
  CoinGeckoApiRateResponse,
  Rate,
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

  async getCryptoRate(assetId: string, currency: string): Promise<Rate> {
    const cacheKey = generateCacheKey(assetId, currency);
    try {
      const cachedRate = await this.cacheManager.get<number>(cacheKey);
      if (cachedRate) {
        this.logger.log(`Cache hit for key ${cacheKey}`);
        return { rate: cachedRate, cached: true };
      }
    } catch (error) {
      this.logger.warn(
        `Failed to get rate for assetId ${assetId} and currency ${currency} from cache, will fetch from api: ${error}`,
      );
    }

    const rate = await this.fetchRate(assetId, currency);
    const message = `Successfully fetched rate for asset ${assetId} by currency ${currency} from CoinGeckoAPI`;
    this.logger.log(message);

    try {
      await this.cacheManager.set(cacheKey, rate, TTlTimes.MINUTE);
      this.logger.log(`Updated cache: key ${cacheKey}, rate ${rate}`);
    } catch (error) {
      this.logger.warn(
        `Failed to update cache with rate for assetId ${assetId} and currency ${currency}: ${error}`,
      );
    }

    return { rate, cached: false };
  }

  private async fetchRate(assetId: string, currency: string): Promise<number> {
    const apiKey = this.configService.get<string>('COINGECKO_API_KEY');
    const requestUrl = this.generateRequestURL(assetId, currency);
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
    if (!data[assetId] || !data[assetId][currency]) {
      this.logger.error(
        `An attempt was made to retrieve rate for an unavailable crypto or currency`,
      );
      throw new RpcException(
        new BadRequestException(
          'Rate not available for the given crypto or currency.',
        ),
      );
    }
    return data[assetId][currency];
  }

  private generateRequestURL(assetId: string, currency: string): string {
    return `https://api.coingecko.com/api/v3/simple/price?ids=${assetId}&vs_currencies=${currency}&precision=2`;
  }
}
