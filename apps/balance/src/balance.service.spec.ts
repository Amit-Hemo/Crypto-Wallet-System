import { AppLoggerService, FileManagementService } from '@app/shared';
import { GetRatePayloadDto } from '@app/shared/dto/get-rate.dto';
import { serviceNames } from '@app/shared/general/service-names';
import { CryptoAsset } from '@app/shared/interfaces/asset.interface';
import { UserBalance } from '@app/shared/interfaces/balance.interface';
import { RatesResponse } from '@app/shared/interfaces/rate.interface';
import { ClientProxy } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { BalanceService } from './balance.service';

describe('BalanceService', () => {
  let service: BalanceService;
  let fileManagementService: FileManagementService;
  let logger: AppLoggerService;
  let clientRateService: ClientProxy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BalanceService,
        {
          provide: FileManagementService,
          useValue: {
            readJSON: jest.fn(),
            writeJSON: jest.fn(),
          },
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
          provide: serviceNames.RATE,
          useValue: {
            send: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BalanceService>(BalanceService);
    fileManagementService = module.get<FileManagementService>(
      FileManagementService,
    );
    clientRateService = module.get<ClientProxy>(serviceNames.RATE);
    logger = await module.resolve(AppLoggerService);
  });

  describe('addAssetToBalance, happy flows', () => {
    it('should create a new user balance with a new asset with amount', async () => {
      const userId = 'test_user_1';
      const asset: CryptoAsset = { id: 'bitcoin', amount: 1.5 };

      //mocking the file
      const existingBalances = [];
      const expectedBalances = [{ userId, assets: [{ ...asset }] }];
      jest
        .spyOn(fileManagementService, 'readJSON')
        .mockResolvedValue(existingBalances);

      await service.addAssetToBalance(userId, asset);
      expect(fileManagementService.writeJSON).toHaveBeenCalledWith(
        'balances',
        expectedBalances,
      );
    });

    it('should raise an asset by amount in user balance', async () => {
      const userId = 'test_user_2';
      const asset: CryptoAsset = { id: 'bitcoin', amount: 1.5 };

      //mocking the file
      const existingBalances = [{ userId, assets: [] }];
      const expectedBalances = [{ userId, assets: [{ ...asset }] }];
      jest
        .spyOn(fileManagementService, 'readJSON')
        .mockResolvedValue(existingBalances);

      await service.addAssetToBalance(userId, asset);
      expect(fileManagementService.writeJSON).toHaveBeenCalledWith(
        'balances',
        expectedBalances,
      );
    });
  });

  describe('removeAssetFromBalance, happy flows', () => {
    it('should decrease an asset amount from existing user balacnce', async () => {
      const userId = 'test_user_1';
      const assetId = 'bitcoin';
      const amount = 2;

      //mocking the file
      const existingBalances = [
        { userId, assets: [{ id: 'bitcoin', amount: 4 }] },
      ];
      const expectedBalances = [
        { userId, assets: [{ id: 'bitcoin', amount: 2 }] },
      ];
      jest
        .spyOn(fileManagementService, 'readJSON')
        .mockResolvedValue(existingBalances);

      await service.removeAssetFromBalance(userId, assetId, amount);
      expect(fileManagementService.writeJSON).toHaveBeenCalledWith(
        'balances',
        expectedBalances,
      );
    });

    it('should remove an asset when amount reaches 0 in user balance', async () => {
      const userId = 'test_user_2';
      const assetId = 'bitcoin';
      const amount = 2;

      //mocking the file
      const existingBalances = [
        { userId, assets: [{ id: 'bitcoin', amount: 2 }] },
      ];
      const expectedBalances = [{ userId, assets: [] }];
      jest
        .spyOn(fileManagementService, 'readJSON')
        .mockResolvedValue(existingBalances);

      await service.removeAssetFromBalance(userId, assetId, amount);
      expect(fileManagementService.writeJSON).toHaveBeenCalledWith(
        'balances',
        expectedBalances,
      );
    });
  });

  describe('removeAssetFromBalance, sad flows', () => {
    it('should throw an error when user does not have balance', async () => {
      const userId = 'test_user_1';
      const assetId = 'bitcoin';
      const amount = 2;

      //mocking the file
      jest.spyOn(fileManagementService, 'readJSON').mockResolvedValue([]);

      await expect(
        service.removeAssetFromBalance(userId, assetId, amount),
      ).rejects.toThrow(/not have balance/i);
    });

    it('should throw an error when asset not found in user balance', async () => {
      const userId = 'test_user_1';
      const assetId = 'bitcoin';
      const amount = 2;

      //mocking the file
      jest
        .spyOn(fileManagementService, 'readJSON')
        .mockResolvedValue([{ userId, assets: [] }]);

      await expect(
        service.removeAssetFromBalance(userId, assetId, amount),
      ).rejects.toThrow(/not found/i);
    });

    it('should throw an error when trying to decrease an asset by amount higher than original', async () => {
      const userId = 'test_user_1';
      const assetId = 'bitcoin';
      const amount = 3;

      //mocking the file
      jest
        .spyOn(fileManagementService, 'readJSON')
        .mockResolvedValue([{ userId, assets: [{ id: assetId, amount: 2 }] }]);

      await expect(
        service.removeAssetFromBalance(userId, assetId, amount),
      ).rejects.toThrow(/amount/i);
    });
  });

  describe('getBalancesValues, happy flow', () => {
    it('should get user balance including the values of the assets', async () => {
      const userId = 'test_user_1';
      const currency = 'usd';
      const assetId = 'bitcoin';
      const amount = 2;
      const mockRate = 50000;
      const ratePayload: GetRatePayloadDto = {
        userId,
        assetIds: assetId,
        currency,
      };

      // mocking file
      const existingBalances = [{ userId, assets: [{ id: assetId, amount }] }];
      jest
        .spyOn(fileManagementService, 'readJSON')
        .mockResolvedValue(existingBalances);

      // mocking rate service response
      const mockRatesResponse: RatesResponse = {
        rates: [{ [assetId]: mockRate }],
        currency,
        cached: 'none',
      };
      jest
        .spyOn(clientRateService, 'send')
        .mockReturnValue(of(mockRatesResponse));

      const result = await service.getBalancesValues(userId, currency);
      expect(clientRateService.send).toHaveBeenCalledWith(
        { cmd: 'get_rate' },
        ratePayload,
      );
      expect(result).toEqual<UserBalance>({
        userId,
        assets: [{ id: assetId, amount, valueInCurrency: mockRate * amount }],
      });
    });
  });

  describe('getTotalBalance, happy flow', () => {
    it('should get user total balance value', async () => {
      const userId = 'test_user_1';
      const currency = 'usd';
      const mockRateBitcoin = 50000;
      const mockRateEthereum = 2000;
      const ratePayload: GetRatePayloadDto = {
        userId,
        assetIds: 'bitcoin,ethereum',
        currency,
      };

      // mocking file
      const existingBalances = [
        {
          userId,
          assets: [
            { id: 'bitcoin', amount: 2 },
            { id: 'ethereum', amount: 5 },
          ],
        },
      ];
      jest
        .spyOn(fileManagementService, 'readJSON')
        .mockResolvedValue(existingBalances);

      // mocking rate service response
      const mockRatesResponse: RatesResponse = {
        rates: [{ bitcoin: mockRateBitcoin }, { ethereum: mockRateEthereum }],
        currency,
        cached: 'none',
      };
      jest
        .spyOn(clientRateService, 'send')
        .mockReturnValue(of(mockRatesResponse));

      const result = await service.getTotalBalance(userId, currency);
      expect(clientRateService.send).toHaveBeenCalledWith(
        { cmd: 'get_rate' },
        ratePayload,
      );
      expect(result).toEqual(110000);
    });
  });
});
