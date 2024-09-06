import { AppLoggerService } from '@app/shared';
import { CoinGeckoApiRateResponse } from '@app/shared/interfaces/rate.interface';
import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable } from '@nestjs/common';
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
  ) {
    this.logger.setContext(RateService.name);
  }

  async getCryptoRate(assetId: string, currency: string): Promise<number> {
    const requestUrl = this.generateRequestURL(assetId, currency);
    const apiKey = this.configService.get<string>('COINGECKO_API_KEY');
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

    const message = `Successfully retrieved rate for asset ${assetId} by currency ${currency}`;
    this.logger.log(message);
    return data[assetId][currency];
  }

  private generateRequestURL(assetId: string, currency: string): string {
    return `https://api.coingecko.com/api/v3/simple/price?ids=${assetId}&vs_currencies=${currency}&precision=2`;
  }
}
