import { AppLoggerService } from '@app/shared';
import { CoinGeckoApiAssetResponse } from '@app/shared/interfaces/asset.interface';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import { Repository } from 'typeorm';
import { Asset as AssetEntity } from '../entities/Asset';

@Injectable()
export class AssetService {
  constructor(
    @InjectRepository(AssetEntity)
    private readonly assetRepository: Repository<AssetEntity>,
    private readonly logger: AppLoggerService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    logger.setContext(AssetService.name);
  }

  async getAssetBySearchId(searchId: string): Promise<AssetEntity | null> {
    try {
      const asset = await this.assetRepository
        .createQueryBuilder('asset')
        .where('asset.search_id = :id', { id: searchId })
        .getOne();
      this.logger.log('Successfully retrieved asset');
      return asset;
    } catch (error) {
      this.logger.error('An error occured while retrieving asset from db');
      throw error;
    }
  }

  @Cron('50 23 * * *') //23:50 since there is a midnight cron also that might depend on this
  async updateAssets() {
    try {
      this.logger.log('[CRON] Updating assets entries...');
      const availableAssets = await this.fetchAvailableAssets();
      const assetsToDBEntries = availableAssets.map(({ id, symbol, name }) => ({
        search_id: id,
        symbol,
        name,
      }));
      await this.assetRepository
        .createQueryBuilder('asset')
        .insert()
        .values(assetsToDBEntries)
        .orUpdate(['name', 'symbol'], ['search_id'], {
          skipUpdateIfNoValuesChanged: true,
        })
        .execute();

      this.logger.log('[CRON] Successfully updated assets');
    } catch (error) {
      this.logger.error('[CRON] An error occured while retrieving assets');
      throw error;
    }
  }

  private async fetchAvailableAssets(): Promise<CoinGeckoApiAssetResponse[]> {
    const apiKey = this.configService.get<string>('COINGECKO_API_KEY');
    const requestUrl = 'https://api.coingecko.com/api/v3/coins/list';
    const { data } = await firstValueFrom(
      this.httpService
        .get<CoinGeckoApiAssetResponse[]>(requestUrl, {
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
                new Error(
                  'An error happened when connecting to coin gecko API',
                ),
            );
          }),
        ),
    );
    this.logger.log('Successfully fetched all assets from CoinGeckoAPI');
    return data;
  }
}
