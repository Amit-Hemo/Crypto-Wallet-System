import { AppLoggerService, FileManagementService } from '@app/shared';
import { CryptoAsset } from '@app/shared/interfaces/asset.interface';
import { UserBalance } from '@app/shared/interfaces/balance.interface';
import { Injectable, NotFoundException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class BalanceService {
  private readonly dbFilename = 'balances';

  constructor(
    private readonly fileManagementService: FileManagementService,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext(BalanceService.name);
  }

  async getBalance(userId: string): Promise<UserBalance> {
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

      const message = `Successfully added asset ${asset.name} by ${asset.amount} to user ${userId}'s balance`;
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
        this.logger.warn(
          `Asset ${existingAsset.name} has been descread to 0, removing asset entirely`,
        );
        userBalance.assets = userBalance.assets.filter(
          (currAsset) => currAsset.id !== assetId,
        );
      }

      await this.fileManagementService.writeJSON<UserBalance[]>(
        this.dbFilename,
        data,
      );

      const message = `Successfully removed asset ${existingAsset.name} by ${amount} to user ${userId}'s balance`;
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
}
