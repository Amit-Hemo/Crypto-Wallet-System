import { AppLoggerService } from '@app/shared';
import { CoinGeckoApiAssetResponse } from '@app/shared/interfaces/asset.interface';
import { mockRepository } from '@app/shared/mocks';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { of } from 'rxjs';
import { Repository } from 'typeorm';
import { AssetService } from '../asset/asset.service';
import { Asset } from '../entities/Asset';

describe('AssetService', () => {
  let assetService: AssetService;
  let assetRepository: Repository<Asset>;
  let httpService: HttpService;

  const ASSET_REPOSITORY_TOKEN = getRepositoryToken(Asset);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetService,
        ConfigService,
        {
          provide: ASSET_REPOSITORY_TOKEN,
          useValue: mockRepository,
        },
        {
          provide: AppLoggerService,
          useValue: {
            log: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            setContext: jest.fn(),
          },
        },
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    assetService = module.get<AssetService>(AssetService);
    assetRepository = module.get(ASSET_REPOSITORY_TOKEN);
    httpService = module.get<HttpService>(HttpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAssetBySearchId, happy flows', () => {
    it('should return the correct asset', async () => {
      const searchId = 'bitcoin';
      const assetDB: Asset = {
        id: 1,
        search_id: searchId,
        name: 'Bitcoin',
        symbol: 'btc',
      };

      jest
        .spyOn(assetRepository.createQueryBuilder(), 'getOne')
        .mockResolvedValueOnce(assetDB);

      const res = await assetService.getAssetBySearchId(searchId);
      expect(assetRepository.createQueryBuilder).toHaveBeenCalledWith('asset');
      expect(res).toEqual<Asset>(assetDB);
    });

    it('should return null if asset not found', async () => {
      const searchId = 'fake';

      jest
        .spyOn(assetRepository.createQueryBuilder(), 'getOne')
        .mockResolvedValueOnce(null);

      const res = await assetService.getAssetBySearchId(searchId);
      expect(assetRepository.createQueryBuilder).toHaveBeenCalledWith('asset');
      expect(res).toEqual<Asset>(null);
    });
  });

  describe('updateAssets, happy flow', () => {
    it('should upsert asset db with assets from api', async () => {
      const apiAssets: CoinGeckoApiAssetResponse[] = [
        {
          id: 'bitcoin',
          name: 'Bitcoin',
          symbol: 'btc',
        },
      ];

      jest
        .spyOn(assetService as any, 'fetchAvailableAssets')
        .mockResolvedValueOnce(apiAssets);

      const queryBuilder = assetRepository.createQueryBuilder();
      await assetService.updateAssets();
      expect(assetRepository.createQueryBuilder).toHaveBeenCalledWith('asset');
      expect(queryBuilder.insert).toHaveBeenCalled();
      expect(queryBuilder.insert().values).toHaveBeenCalledWith([
        { search_id: 'bitcoin', name: 'Bitcoin', symbol: 'btc' },
      ]);
      expect(queryBuilder.execute).toHaveBeenCalled();
    });
  });

  describe('fetchAvailableAssets, happy flow', () => {
    it('should fetch api assets successfully', async () => {
      const mockApiResponse: AxiosResponse<CoinGeckoApiAssetResponse[]> = {
        data: [{ id: 'bitcoin', name: 'Bitcoin', symbol: 'btc' }],
        headers: {},
        config: {
          headers: {},
        } as InternalAxiosRequestConfig,
        status: 200,
        statusText: 'OK',
      };

      jest.spyOn(httpService, 'get').mockReturnValue(of(mockApiResponse));
      const response = await assetService['fetchAvailableAssets']();
      expect(response).toEqual(mockApiResponse.data);
      expect(httpService.get).toHaveBeenCalledWith(
        'https://api.coingecko.com/api/v3/coins/list',
        { headers: { 'x-cg-demo-api-key': undefined } },
      );
    });
  });
});
