import { AppLoggerService, FileManagementService } from '@app/shared';
import { GetRatePayloadDto } from '@app/shared/dto/get-rate.dto';
import { serviceNames } from '@app/shared/general/service-names';
import { CryptoAsset } from '@app/shared/interfaces/asset.interface';
import { UserBalance } from '@app/shared/interfaces/balance.interface';
import { Rate, RatesResponse } from '@app/shared/interfaces/rate.interface';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class BalanceService {
  private readonly dbFilename = 'balances';

  constructor(
    private readonly fileManagementService: FileManagementService,
    private readonly logger: AppLoggerService,
    @Inject(serviceNames.RATE) private readonly clientRateService: ClientProxy,
  ) {
    this.logger.setContext(BalanceService.name);
  }

  async addAssetToBalance(
    userId: string,
    asset: CryptoAsset,
  ): Promise<UserBalance> {
    try {
      const data = await this.fileManagementService.readJSON<UserBalance[]>(
        this.dbFilename,
      );
      let userBalance = data.find((balance) => balance.userId === userId);
      if (!userBalance) {
        userBalance = { userId, assets: [] };
        data.push(userBalance);
      }

      const existingAsset = userBalance.assets.find(
        (currAsset) => currAsset.id === asset.id,
      );
      if (!existingAsset) userBalance.assets.push(asset);
      else existingAsset.amount += asset.amount;

      await this.fileManagementService.writeJSON<UserBalance[]>(
        this.dbFilename,
        data,
      );

      const message = `Successfully added asset ${asset.id} by ${asset.amount} to user ${userId}'s balance`;
      this.logger.log(message);

      return userBalance;
    } catch (error) {
      this.logger.error(
        `Failed to add/update asset for user ${userId}: ${error.message}`,
      );
      throw new RpcException('Failed to add asset to the user');
    }
  }

  async removeAssetFromBalance(
    userId: string,
    assetId: string,
    amount: number,
  ): Promise<void> {
    try {
      const data = await this.fileManagementService.readJSON<UserBalance[]>(
        this.dbFilename,
      );
      const userBalance = data.find((balance) => balance.userId === userId);
      if (!userBalance) {
        this.logger.error(`User ${userId} is not found in db`);
        throw new RpcException(
          new NotFoundException('User does not have balance'),
        );
      }

      const existingAsset = userBalance.assets.find(
        (currAsset) => currAsset.id === assetId,
      );
      if (!existingAsset) {
        this.logger.error(
          `User ${userId} tried to remove an invalid asset ${assetId} from balance`,
        );
        throw new RpcException(
          new NotFoundException(`Asset not found in user's balance`),
        );
      }
      if (existingAsset.amount < amount) {
        this.logger.error(
          `Insufficient amount to reduce ${amount} from asset ${assetId} for user ${userId} balance`,
        );
        throw new RpcException(
          new NotFoundException('Insufficient amount to remove'),
        );
      }

      existingAsset.amount -= amount;
      if (existingAsset.amount === 0) {
        this.logger.log(
          `Asset ${existingAsset.id} has been descread to 0, removing asset entirely`,
        );
        userBalance.assets = userBalance.assets.filter(
          (currAsset) => currAsset.id !== assetId,
        );
      }

      await this.fileManagementService.writeJSON<UserBalance[]>(
        this.dbFilename,
        data,
      );

      const message = `Successfully removed asset ${existingAsset.id} by ${amount} to user ${userId}'s balance`;
      this.logger.log(message);
    } catch (error) {
      this.logger.error(
        `Failed to remove asset for user ${userId}: ${error?.message ?? ''}`,
      );
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException('Failed to remove asset to the user');
    }
  }

  async getTotalBalance(userId: string, currency: string): Promise<number> {
    const { assets } = await this.getBalance(userId);
    const assetIds = assets.map((asset) => asset.id).join(',');
    const payload: GetRatePayloadDto = { userId, assetIds, currency };
    const { rates: rateRecords } = await lastValueFrom(
      this.clientRateService.send<RatesResponse>({ cmd: 'get_rate' }, payload),
    );
    const totalBalance = this.calculateTotalBalanceValue(rateRecords, assets);
    const message = `Successfully calculated total balance value with currency ${currency} to user ${userId}`;
    this.logger.log(message);
    return totalBalance;
  }

  async getBalancesValues(
    userId: string,
    currency: string,
  ): Promise<UserBalance> {
    const userBalance = await this.getBalance(userId);
    const assetIds = userBalance.assets.map((asset) => asset.id).join(',');
    const payload: GetRatePayloadDto = { userId, assetIds, currency };
    const { rates: rateRecords } = await lastValueFrom(
      this.clientRateService.send<RatesResponse>({ cmd: 'get_rate' }, payload),
    );
    const ratesMap = new Map<string, number>(
      rateRecords.map((record) => [
        Object.keys(record)[0],
        Object.values(record)[0],
      ]),
    );
    for (const asset of userBalance.assets) {
      if (!ratesMap.has(asset.id)) asset.valueInCurrency = 0;
      const rate = ratesMap.get(asset.id);
      asset.valueInCurrency = this.calculateBalanceValue(asset.amount, rate);
    }

    const message = `Successfully balance values with currency ${currency} to user ${userId}`;
    this.logger.log(message);
    return userBalance;
  }

  private async getBalance(userId: string): Promise<UserBalance> {
    try {
      const data = await this.fileManagementService.readJSON<UserBalance[]>(
        this.dbFilename,
      );
      const userBalance = data.find((balance) => balance.userId === userId);
      if (!userBalance) {
        this.logger.error(`User ${userId} is not found in db`);
        throw new RpcException(
          new NotFoundException('User does not have balance'),
        );
      }

      const message = `Successfully retrieved user balance for ${userId}`;
      this.logger.log(message);

      return userBalance;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve user balance for ${userId}: ${error?.message ?? ''}`,
      );
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException('Failed to retrieve balance to the user');
    }
  }

  private calculateTotalBalanceValue(
    ratesRecords: Rate[],
    assets: CryptoAsset[],
  ): number {
    const ratesMap = new Map<string, number>(
      ratesRecords.map((record) => [
        Object.keys(record)[0],
        Object.values(record)[0],
      ]),
    );
    const totalBalanceValue = assets.reduce((prev, currAsset) => {
      const { id, amount } = currAsset;
      if (!ratesMap.has(id)) return prev;
      const rate = ratesMap.get(id);
      return prev + this.calculateBalanceValue(amount, rate);
    }, 0);

    return totalBalanceValue;
  }
  private calculateBalanceValue(
    amount: number,
    rateInCurrency: number,
  ): number {
    return Number((amount * rateInCurrency).toFixed(2));
  }
}
