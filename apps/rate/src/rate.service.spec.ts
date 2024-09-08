import { AppLoggerService } from '@app/shared';
import { TTlTimes } from '@app/shared/cache/ttl-times';
import {
  CoinGeckoApiRateResponse,
  RatesResponse,
} from '@app/shared/interfaces/rate.interface';
import { HttpService } from '@nestjs/axios';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { of } from 'rxjs';
import { RateService } from './rate.service';

describe('RateService', () => {
  let service: RateService;
  let httpService: HttpService;
  let cacheManager: Cache;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RateService,
        ConfigService,
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
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RateService>(RateService);
    httpService = module.get<HttpService>(HttpService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
  });

  describe('getCryptoRate, happy flow', () => {
    it('should get fully cached result if cache hit', async () => {
      const assetIds = ['bitcoin'];
      const currency = 'usd';
      const mockCachedRate = 50000;
      const expectedCacheKey = `rate:${assetIds[0]}_${currency}`;

      // make cache hits
      jest.spyOn(cacheManager, 'get').mockResolvedValue(mockCachedRate);

      const result = await service.getCryptoRate(assetIds, currency);
      expect(cacheManager.get).toHaveBeenCalledWith(expectedCacheKey);
      expect(result).toEqual<RatesResponse>({
        rates: [{ bitcoin: mockCachedRate }],
        currency,
        cached: 'all',
      });
    });

    it('should fetch stale results from external API and cache them', async () => {
      const assetIds = ['bitcoin'];
      const currency = 'usd';
      const mockedRate = 50000;
      const mockApiResponse: AxiosResponse<CoinGeckoApiRateResponse> = {
        data: {
          [assetIds[0]]: {
            [currency]: mockedRate,
          },
        },
        headers: {},
        config: {
          headers: {},
        } as InternalAxiosRequestConfig,
        status: 200,
        statusText: 'OK',
      };
      const expectedCacheKey = `rate:${assetIds[0]}_${currency}`;

      // make cache misses
      jest.spyOn(cacheManager, 'get').mockResolvedValue(null);
      // mock api response
      jest.spyOn(httpService, 'get').mockReturnValue(of(mockApiResponse));

      const result = await service.getCryptoRate(assetIds, currency);
      expect(result).toEqual<RatesResponse>({
        rates: [{ [assetIds[0]]: mockedRate }],
        currency,
        cached: 'none',
      });
      expect(cacheManager.set).toHaveBeenCalledWith(
        expectedCacheKey,
        mockedRate,
        5 * TTlTimes.MINUTE,
      );
    });
  });
  describe('getCryptoRate, sad flow', () => {
    it('should throw an error for invalid currencies', async () => {
      const assetIds = ['bitcoin'];
      const currency = 'fake_currency';
      const mockApiResponse: AxiosResponse<CoinGeckoApiRateResponse> = {
        data: {
          [assetIds[0]]: {},
        },
        headers: {},
        config: {
          headers: {},
        } as InternalAxiosRequestConfig,
        status: 200,
        statusText: 'OK',
      };

      // make cache hits
      jest.spyOn(cacheManager, 'get').mockResolvedValue(null);
      jest.spyOn(httpService, 'get').mockReturnValue(of(mockApiResponse));

      await expect(service.getCryptoRate(assetIds, currency)).rejects.toThrow(
        /invalid/i,
      );
    });
  });
});
