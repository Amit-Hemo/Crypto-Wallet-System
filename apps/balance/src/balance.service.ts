import { AppLoggerService, FileManagementService } from '@app/shared';
import { Injectable } from '@nestjs/common';

interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  amount: number;
}

interface UserBalance {
  userId: string;
  assets: CryptoAsset[];
}

@Injectable()
export class BalanceService {
  constructor(
    private readonly fileManagementService: FileManagementService,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext(BalanceService.name);
  }

  async getBalanceWithId(balanceId: string, userId: string): Promise<string> {
    const dataObj =
      await this.fileManagementService.readJSON<UserBalance[]>('balances');
    const userBalanceInfo = dataObj.filter(
      (currUserInfo) => currUserInfo.userId === userId,
    );
    this.logger.log('hello from my custom logger');
    console.log(userBalanceInfo);
    return `Hello from balance with id ${balanceId} of user: ${userId}`;
  }
}
