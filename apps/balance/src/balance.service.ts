import { AppLoggerService, FileManagementService } from '@app/shared';
import { CryptoAsset } from '@app/shared/interfaces/asset.interface';
import { UserBalance } from '@app/shared/interfaces/balance.interface';
import { Injectable } from '@nestjs/common';
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
}
