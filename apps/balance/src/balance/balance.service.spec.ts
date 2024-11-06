import { AppLoggerService } from '@app/shared';
import { GetRatePayloadDto } from '@app/shared/dto/get-rate.dto';
import { Services } from '@app/shared/general/services.contants';
import { BalanceAsset } from '@app/shared/interfaces/asset.interface';
import { UserBalance } from '@app/shared/interfaces/balance.interface';
import { RatesResponse } from '@app/shared/interfaces/rate.interface';
import { mockRepository } from '@app/shared/mocks';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { of } from 'rxjs';
import { Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { AssetService } from '../asset/asset.service';
import { Asset } from '../entities/Asset';
import { Balance } from '../entities/Balance';
import { BalanceService } from './balance.service';

describe('BalanceService', () => {
  let clientRateService: ClientProxy;
  let balanceService: BalanceService;
  let assetService: AssetService;
  let balanceRepository: Repository<Balance>;

  const BALANCE_REPOSITORY_TOKEN = getRepositoryToken(Balance);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BalanceService,
        {
          provide: AssetService,
          useValue: {
            getAssetBySearchId: jest.fn(),
          },
        },
        {
          provide: BALANCE_REPOSITORY_TOKEN,
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
          provide: Services.RATE,
          useValue: {
            send: jest.fn(),
          },
        },
      ],
    }).compile();

    balanceService = module.get<BalanceService>(BalanceService);
    assetService = module.get<AssetService>(AssetService);
    clientRateService = module.get<ClientProxy>(Services.RATE);
    balanceRepository = module.get(BALANCE_REPOSITORY_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addAssetToBalance, happy flows', () => {
    it('should add a new asset to the user balance', async () => {
      const userId = 1;
      const searchId = 'bitcoin';
      const assetDB: Asset = {
        id: 1,
        search_id: 'bitcoin',
        name: 'Bitcoin',
        symbol: 'btc',
      };
      const balanceAssetValues: QueryDeepPartialEntity<Balance> = {
        user_id: userId,
        amount: 10,
        asset_id: 1,
      };
      const queryBuilder = balanceRepository.createQueryBuilder();

      jest
        .spyOn(assetService, 'getAssetBySearchId')
        .mockResolvedValueOnce({ ...assetDB });
      //mock no balance asset for this user
      jest.spyOn(balanceService, 'getBalanceAsset').mockResolvedValueOnce(null);

      await balanceService.addAssetToBalance(userId, searchId, 10);

      expect(assetService.getAssetBySearchId).toHaveBeenCalledWith(searchId);
      expect(balanceRepository.createQueryBuilder).toHaveBeenCalledWith(
        'balance',
      );
      expect(queryBuilder.insert).toHaveBeenCalled();
      expect(queryBuilder.insert().values).toHaveBeenCalledWith(
        balanceAssetValues,
      );
      expect(queryBuilder.execute).toHaveBeenCalled();
    });

    it('should update an existing asset in the user balance', async () => {
      const userId = 1;
      const searchId = 'bitcoin';
      const addByAmount = 10;
      const assetDB: Asset = {
        id: 1,
        search_id: 'bitcoin',
        name: 'Bitcoin',
        symbol: 'btc',
      };
      const existingBalanceAsset: Omit<Balance, 'asset'> = {
        user_id: userId,
        id: 22,
        amount: 5,
        asset_id: assetDB.id,
      };

      jest
        .spyOn(assetService, 'getAssetBySearchId')
        .mockResolvedValueOnce({ ...assetDB });
      //mock user having the same balance asset row
      jest
        .spyOn(balanceService, 'getBalanceAsset')
        .mockResolvedValueOnce(existingBalanceAsset);

      await balanceService.addAssetToBalance(userId, searchId, addByAmount);
      expect(assetService.getAssetBySearchId).toHaveBeenCalledWith(searchId);
      expect(balanceRepository.save).toHaveBeenCalledWith({
        ...existingBalanceAsset,
        amount: 15,
      });
    });
  });

  describe('addAssetToBalance, sad flows', () => {
    it('should throw BadRequestException if the asset is not found', async () => {
      const userId = 1;
      const searchId = 'bitcoin';
      const addByAmount = 10;

      jest
        .spyOn(assetService, 'getAssetBySearchId')
        .mockResolvedValueOnce(null);

      await expect(
        balanceService.addAssetToBalance(userId, searchId, addByAmount),
      ).rejects.toThrow(BadRequestException);
      expect(assetService.getAssetBySearchId).toHaveBeenCalledWith(searchId);
    });
  });

  describe('removeAssetFromBalance, happy flows', () => {
    it('should decrease an asset amount from existing user balacnce', async () => {
      const userId = 1;
      const searchId = 'bitcoin';
      const removeByAmount = 4;
      const assetDB: Asset = {
        id: 1,
        search_id: 'bitcoin',
        name: 'Bitcoin',
        symbol: 'btc',
      };
      const existingBalanceAsset: Omit<Balance, 'asset'> = {
        user_id: userId,
        id: 22,
        amount: 5,
        asset_id: assetDB.id,
      };
      const remainingAmount = existingBalanceAsset.amount - removeByAmount;

      jest
        .spyOn(assetService, 'getAssetBySearchId')
        .mockResolvedValueOnce({ ...assetDB });
      //mock user having the same balance asset row
      jest
        .spyOn(balanceService, 'getBalanceAsset')
        .mockResolvedValueOnce(existingBalanceAsset);

      await balanceService.removeAssetFromBalance(
        userId,
        searchId,
        removeByAmount,
      );
      expect(assetService.getAssetBySearchId).toHaveBeenCalledWith(searchId);
      expect(balanceRepository.save).toHaveBeenCalledWith({
        ...existingBalanceAsset,
        amount: remainingAmount,
      });
    });

    it('should remove an asset when amount reaches 0 in user balance', async () => {
      const userId = 1;
      const searchId = 'bitcoin';
      const removeByAmount = 5;
      const assetDB: Asset = {
        id: 1,
        search_id: 'bitcoin',
        name: 'Bitcoin',
        symbol: 'btc',
      };
      const existingBalanceAsset: Omit<Balance, 'asset'> = {
        user_id: userId,
        id: 22,
        amount: 5,
        asset_id: assetDB.id,
      };
      const queryBuilder = balanceRepository.createQueryBuilder();

      jest
        .spyOn(assetService, 'getAssetBySearchId')
        .mockResolvedValueOnce({ ...assetDB });
      //mock user having the same balance asset row
      jest
        .spyOn(balanceService, 'getBalanceAsset')
        .mockResolvedValueOnce(existingBalanceAsset);

      await balanceService.removeAssetFromBalance(
        userId,
        searchId,
        removeByAmount,
      );
      expect(assetService.getAssetBySearchId).toHaveBeenCalledWith(searchId);
      expect(balanceRepository.createQueryBuilder).toHaveBeenCalledWith(
        'balance',
      );
      expect(queryBuilder.delete).toHaveBeenCalled();
      expect(queryBuilder.execute).toHaveBeenCalled();
      expect(balanceRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('removeAssetFromBalance, sad flows', () => {
    it('should throw BadRequestException if the asset is not found', async () => {
      const userId = 1;
      const searchId = 'bitcoin';
      const removeByAmount = 10;

      jest
        .spyOn(assetService, 'getAssetBySearchId')
        .mockResolvedValueOnce(null);

      await expect(
        balanceService.removeAssetFromBalance(userId, searchId, removeByAmount),
      ).rejects.toThrow(BadRequestException);
      expect(assetService.getAssetBySearchId).toHaveBeenCalledWith(searchId);
    });

    it('should throw NotFoundException when user does not have the asset in balance', async () => {
      const userId = 1;
      const searchId = 'bitcoin';
      const removeByAmount = 10;

      jest.spyOn(assetService, 'getAssetBySearchId').mockResolvedValueOnce({
        id: 1,
        search_id: 'bitcoin',
        name: 'Bitcoin',
        symbol: 'btc',
      });
      jest.spyOn(balanceService, 'getBalanceAsset').mockResolvedValueOnce(null);

      await expect(
        balanceService.removeAssetFromBalance(userId, searchId, removeByAmount),
      ).rejects.toThrow(NotFoundException);
      expect(assetService.getAssetBySearchId).toHaveBeenCalledWith(searchId);
    });

    it('should throw BadRequestException when trying to decrease an asset by amount higher than original', async () => {
      const userId = 1;
      const searchId = 'bitcoin';
      const removeByAmount = 6;
      const assetDB: Asset = {
        id: 1,
        search_id: 'bitcoin',
        name: 'Bitcoin',
        symbol: 'btc',
      };
      const existingBalanceAsset: Omit<Balance, 'asset'> = {
        user_id: userId,
        id: 22,
        amount: 5,
        asset_id: assetDB.id,
      };

      jest
        .spyOn(assetService, 'getAssetBySearchId')
        .mockResolvedValueOnce(assetDB);
      jest
        .spyOn(balanceService, 'getBalanceAsset')
        .mockResolvedValueOnce(existingBalanceAsset);

      await expect(
        balanceService.removeAssetFromBalance(userId, searchId, removeByAmount),
      ).rejects.toThrow(BadRequestException);
      expect(assetService.getAssetBySearchId).toHaveBeenCalledWith(searchId);
    });
  });

  describe('getBalancesValues, happy flow', () => {
    it('should get user balance including the values of the assets', async () => {
      const userId = 1;
      const currency = 'usd';

      const assetDB: Asset = {
        id: 1,
        search_id: 'bitcoin',
        name: 'Bitcoin',
        symbol: 'btc',
      };
      const existingBalanceAsset: Balance = {
        id: 22,
        user_id: userId,
        asset_id: 1,
        asset: assetDB,
        amount: 5,
      };

      jest
        .spyOn(balanceRepository.createQueryBuilder(), 'getMany')
        .mockResolvedValueOnce([existingBalanceAsset]);

      // mocking rate service interaction
      const mockRate = 50000;
      const ratePayload: GetRatePayloadDto = {
        userId,
        assetIds: assetDB.search_id,
        currency,
      };
      const mockRatesResponse: RatesResponse = {
        rates: [{ [assetDB.search_id]: mockRate }],
        currency,
        cached: 'none',
      };
      jest
        .spyOn(clientRateService, 'send')
        .mockReturnValue(of(mockRatesResponse));

      const result = await balanceService.getBalancesValues(userId, currency);
      expect(clientRateService.send).toHaveBeenCalledWith(
        { cmd: 'get_rate' },
        ratePayload,
      );
      expect(result).toEqual<UserBalance>({
        userId,
        assets: [
          {
            assetInfo: assetDB,
            amount: existingBalanceAsset.amount,
            valueInCurrency: existingBalanceAsset.amount * mockRate,
          },
        ],
      });
    });

    it('should get empty user balance if user does not have any balance', async () => {
      const userId = 1;
      const currency = 'usd';

      jest
        .spyOn(balanceRepository.createQueryBuilder(), 'getMany')
        .mockResolvedValueOnce([]);

      const result = await balanceService.getBalancesValues(userId, currency);
      expect(clientRateService.send).not.toHaveBeenCalled();
      expect(result).toEqual<UserBalance>({
        userId,
        assets: [],
      });
    });
  });

  describe('getTotalBalance, happy flow', () => {
    it('should get user total balance value', async () => {
      const userId = 1;
      const currency = 'usd';

      const assets: BalanceAsset[] = [
        {
          assetInfo: {
            id: 1,
            search_id: 'bitcoin',
            name: 'Bitcoin',
            symbol: 'btc',
          },
          amount: 1,
          valueInCurrency: 10,
        },
        {
          assetInfo: {
            id: 2,
            search_id: 'ethereum',
            name: 'Ethereum',
            symbol: 'eth',
          },
          amount: 2,
          valueInCurrency: 10,
        },
      ];
      const userBalance: UserBalance = {
        userId,
        assets,
      };

      jest
        .spyOn(balanceService, 'getBalancesValues')
        .mockResolvedValueOnce(userBalance);

      const result = await balanceService.getTotalBalance(userId, currency);
      expect(balanceService.getBalancesValues).toHaveBeenCalledWith(
        userId,
        currency,
      );
      expect(result).toEqual(20);
    });

    it('should get total value of 0 if no balance assets for user', async () => {
      const userId = 1;
      const currency = 'usd';

      const userBalance: UserBalance = {
        userId,
        assets: [],
      };

      jest
        .spyOn(balanceService, 'getBalancesValues')
        .mockResolvedValueOnce(userBalance);

      const result = await balanceService.getTotalBalance(userId, currency);
      expect(balanceService.getBalancesValues).toHaveBeenCalledWith(
        userId,
        currency,
      );
      expect(result).toEqual(0);
    });
  });

  describe('rebalance, happy flow', () => {
    it('should rebalance the assets correctly if provided and in user balance', async () => {
      const userId = 1;
      const currency = 'usd';
      const firstSearchId = 'bitcoin';
      const secondSearchId = 'ethereum';
      const targetPercentages: Record<string, number> = {
        [firstSearchId]: 50,
        [secondSearchId]: 50,
      };
      const assets: BalanceAsset[] = [
        {
          assetInfo: {
            id: 1,
            search_id: firstSearchId,
            name: 'Bitcoin',
            symbol: 'btc',
          },
          amount: 1,
          valueInCurrency: 200,
        },
        {
          assetInfo: {
            id: 2,
            search_id: secondSearchId,
            name: 'Ethereum',
            symbol: 'eth',
          },
          amount: 2,
          valueInCurrency: 100,
        },
      ];
      const userBalance: UserBalance = {
        userId,
        assets,
      };
      const queryBuilder = balanceRepository.createQueryBuilder();

      jest
        .spyOn(balanceService, 'getBalancesValues')
        .mockResolvedValueOnce(userBalance);

      await balanceService.rebalance(userId, currency, targetPercentages);
      expect(balanceService.getBalancesValues).toHaveBeenCalledWith(
        userId,
        currency,
      );
      expect(queryBuilder.update).toHaveBeenCalledTimes(2);
      expect(queryBuilder.update().set).toHaveBeenCalledWith({ amount: 0.75 });
      expect(queryBuilder.update().set).toHaveBeenCalledWith({ amount: 3 });
    });
  });

  describe('rebalance, sad flow', () => {
    it('should throw NotFoundException if user balance is empty', async () => {
      const userId = 1;
      const currency = 'usd';
      const firstSearchId = 'bitcoin';
      const secondSearchId = 'ethereum';
      const targetPercentages: Record<string, number> = {
        [firstSearchId]: 50,
        [secondSearchId]: 50,
      };
      const userBalance: UserBalance = {
        userId,
        assets: [],
      };

      jest
        .spyOn(balanceService, 'getBalancesValues')
        .mockResolvedValueOnce(userBalance);

      await expect(
        balanceService.rebalance(userId, currency, targetPercentages),
      ).rejects.toThrow(NotFoundException);
      expect(balanceService.getBalancesValues).toHaveBeenCalledWith(
        userId,
        currency,
      );
    });

    it('should throw BadRequestException if not all provided assets are in user balance', async () => {
      const userId = 1;
      const currency = 'usd';
      const firstSearchId = 'bitcoin';
      const secondSearchId = 'ethereum';
      const targetPercentages: Record<string, number> = {
        [firstSearchId]: 50,
        [secondSearchId]: 50,
      };
      const userBalance: UserBalance = {
        userId,
        assets: [
          {
            assetInfo: {
              id: 1,
              search_id: firstSearchId,
              name: 'Bitcoin',
              symbol: 'btc',
            },
            amount: 1,
            valueInCurrency: 200,
          },
        ],
      };

      jest
        .spyOn(balanceService, 'getBalancesValues')
        .mockResolvedValueOnce(userBalance);

      await expect(
        balanceService.rebalance(userId, currency, targetPercentages),
      ).rejects.toThrow(BadRequestException);
      expect(balanceService.getBalancesValues).toHaveBeenCalledWith(
        userId,
        currency,
      );
    });

    it('should throw BadRequestException if there are invalid assets provided to rebalance', async () => {
      const userId = 1;
      const currency = 'usd';
      const firstSearchId = 'bitcoin';
      const secondSearchId = 'fake';
      const invalidAssetValue = 0;
      const targetPercentages: Record<string, number> = {
        [firstSearchId]: 50,
        [secondSearchId]: 50,
      };
      const assets: BalanceAsset[] = [
        {
          assetInfo: {
            id: 1,
            search_id: firstSearchId,
            name: 'Bitcoin',
            symbol: 'btc',
          },
          amount: 1,
          valueInCurrency: 200,
        },
        {
          assetInfo: {
            id: 2,
            search_id: secondSearchId,
            name: 'fake',
            symbol: 'fake',
          },
          amount: 2,
          valueInCurrency: invalidAssetValue,
        },
      ];
      const userBalance: UserBalance = {
        userId,
        assets,
      };

      jest
        .spyOn(balanceService, 'getBalancesValues')
        .mockResolvedValueOnce(userBalance);

      await expect(
        balanceService.rebalance(userId, currency, targetPercentages),
      ).rejects.toThrow(BadRequestException);
      expect(balanceService.getBalancesValues).toHaveBeenCalledWith(
        userId,
        currency,
      );
    });
  });
});
