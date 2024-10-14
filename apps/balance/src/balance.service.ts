import { AppLoggerService, FileManagementService } from '@app/shared';
import { GetRatePayloadDto } from '@app/shared/dto/get-rate.dto';
import { MessagePatterns } from '@app/shared/general/message-patterns.constants';
import { Services } from '@app/shared/general/services.contants';
import { CryptoAsset } from '@app/shared/interfaces/asset.interface';
import { UserBalance } from '@app/shared/interfaces/balance.interface';
import { RatesResponse } from '@app/shared/interfaces/rate.interface';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class BalanceService {
  private readonly dbFilename = 'balances';

  constructor(
    private readonly fileManagementService: FileManagementService,
    private readonly logger: AppLoggerService,
    @Inject(Services.RATE) private readonly clientRateService: ClientProxy,
  ) {
    this.logger.setContext(BalanceService.name);
    this.fileManagementService.createDB(this.dbFilename);
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
          new NotFoundException(
            'User does not have balance, please add assets to the user first and try again',
          ),
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
          new BadRequestException('Insufficient amount to remove'),
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
    const { assets } = await this.getBalancesValues(userId, currency);
    if (assets.length === 0) return 0;
    const totalBalance = this.calculateTotalBalanceValue(assets);
    const message = `Successfully calculated total balance value with currency ${currency} to user ${userId}`;
    this.logger.log(message);
    return totalBalance;
  }

  async getBalancesValues(
    userId: string,
    currency: string,
  ): Promise<UserBalance> {
    const userBalance = await this.getBalance(userId);

    if (userBalance.assets.length === 0) return { userId, assets: [] };

    const assetIds = userBalance.assets.map((asset) => asset.id).join(',');
    const payload: GetRatePayloadDto = { userId, assetIds, currency };
    const { rates: rateRecords } = await lastValueFrom(
      this.clientRateService.send<RatesResponse>(
        { cmd: MessagePatterns.GET_RATE },
        payload,
      ),
    );
    const ratesMap = new Map<string, number>(
      rateRecords.map((record) => [
        Object.keys(record)[0],
        Object.values(record)[0],
      ]),
    );
    for (const asset of userBalance.assets) {
      if (!ratesMap.has(asset.id)) {
        asset.valueInCurrency = 0;
        break;
      }
      const rate = ratesMap.get(asset.id);
      asset.valueInCurrency = this.calculateBalanceValue(asset.amount, rate);
    }

    const message = `Successfully balance values with currency ${currency} to user ${userId}`;
    this.logger.log(message);
    return userBalance;
  }

  async rebalance(
    userId: string,
    currency: string,
    targetPercentages: Record<string, number>,
  ): Promise<void> {
    const { assets } = await this.getBalancesValues(userId, currency);
    console.log(assets);
    if (assets.length === 0) {
      this.logger.error('There are no values to rebalance');
      throw new RpcException(new NotFoundException('Nothing to rebalance'));
    }

    const assetsToRebalance = assets.filter(
      (asset) => asset.id in targetPercentages,
    );
    if (assetsToRebalance.length < assets.length) {
      this.logger.warn(
        'Some assets are not included in the rebalance process and will be ignored',
      );
    }

    if (assetsToRebalance.length < Object.keys(targetPercentages).length) {
      this.logger.error(
        "There are assets from target percentages that are not in user's balance",
      );
      throw new RpcException(
        new BadRequestException(
          'Please include only assets you have in the percentages',
        ),
      );
    }
    const invalidAssetIds = assetsToRebalance
      .filter((asset) => asset.valueInCurrency === 0)
      .map((asset) => asset.id);

    if (invalidAssetIds.length > 0) {
      this.logger.error('Invalid assets to be rebalanced');
      throw new RpcException(
        new BadRequestException(
          `Cannot rebalance. The following assets have no value: ${invalidAssetIds.join(',')}`,
        ),
      );
    }

    const totalValue = this.calculateTotalBalanceValue(assetsToRebalance);

    for (const asset of assetsToRebalance) {
      const targetPercentage = targetPercentages[asset.id];
      const targetValue = totalValue * (targetPercentage / 100);
      const rate = asset.valueInCurrency / asset.amount;
      const newAmount = targetValue / rate;
      const deltaToChange = Math.abs(asset.amount - newAmount);
      if (newAmount > asset.amount) {
        this.logger.log(
          `Increasing asset ${asset.id} for user ${userId} by ${deltaToChange} units.`,
        );
        await this.addAssetToBalance(userId, {
          id: asset.id,
          amount: deltaToChange,
        });
      } else {
        this.logger.log(
          `Decreasing asset ${asset.id} for user ${userId} by ${deltaToChange} units.`,
        );
        await this.removeAssetFromBalance(userId, asset.id, deltaToChange);
      }
    }
    this.logger.log(`Rebalance completed successfully for user ${userId}.`);
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
          new NotFoundException(
            'User does not have balance, please add assets to the user first and try again',
          ),
        );
      }

      const message = `Successfully retrieved user balance for ${userId}`;
      this.logger.log(message);

      return userBalance;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve user balance for ${userId}: ${error?.message ?? ''}`,
      );
      throw error;
    }
  }

  private calculateTotalBalanceValue(assets: CryptoAsset[]): number {
    const totalValue = assets.reduce((total, { valueInCurrency }) => {
      return total + valueInCurrency;
    }, 0);

    return Number(totalValue.toFixed(2));
  }
  private calculateBalanceValue(
    amount: number,
    rateInCurrency: number,
  ): number {
    return Number((amount * rateInCurrency).toFixed(2));
  }
}
