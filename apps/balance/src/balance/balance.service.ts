import { AppLoggerService } from '@app/shared';
import { GetRatePayloadDto } from '@app/shared/dto/get-rate.dto';
import { MessagePatterns } from '@app/shared/general/message-patterns.constants';
import { Services } from '@app/shared/general/services.contants';
import { BalanceAsset } from '@app/shared/interfaces/asset.interface';
import { UserBalance } from '@app/shared/interfaces/balance.interface';
import { RatesResponse } from '@app/shared/interfaces/rate.interface';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { lastValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import { AssetService } from '../asset/asset.service';
import { Balance } from '../entities/Balance';

@Injectable()
export class BalanceService {
  constructor(
    private readonly logger: AppLoggerService,
    @InjectRepository(Balance)
    private readonly balanceRepository: Repository<Balance>,
    private readonly assetService: AssetService,
    @Inject(Services.RATE) private readonly clientRateService: ClientProxy,
  ) {
    this.logger.setContext(BalanceService.name);
  }

  async addAssetToBalance(
    userId: number,
    assetSearchId: string,
    amount: number,
  ): Promise<void> {
    try {
      const asset = await this.assetService.getAssetBySearchId(assetSearchId);
      if (!asset) {
        this.logger.error(
          `Asset with search id ${assetSearchId} is invalid or unavailable`,
        );
        throw new BadRequestException('Invalid asset');
      }

      const existingBalanceAsset = await this.getBalanceAsset(userId, asset.id);
      if (existingBalanceAsset) {
        existingBalanceAsset.amount += amount;
        await this.balanceRepository.save(existingBalanceAsset);
      } else {
        await this.balanceRepository
          .createQueryBuilder('balance')
          .insert()
          .values({ user_id: userId, asset_id: asset.id, amount })
          .execute();
      }

      const message = `Successfully added asset ${asset.name} by ${amount} to user ${userId}'s balance`;
      this.logger.log(message);
    } catch (error) {
      this.logger.error(
        `Failed to add/update asset for user ${userId}: ${error.message}`,
      );
      throw error;
    }
  }

  async removeAssetFromBalance(
    userId: number,
    assetSearchId: string,
    amount: number,
  ): Promise<void> {
    try {
      const asset = await this.assetService.getAssetBySearchId(assetSearchId);
      if (!asset) {
        this.logger.error(
          `Asset with search id ${assetSearchId} is invalid or unavailable`,
        );
        throw new BadRequestException('Invalid asset');
      }

      const existingBalanceAsset = await this.getBalanceAsset(userId, asset.id);
      if (!existingBalanceAsset) {
        this.logger.error(
          `User ${userId} tried to remove non existing asset ${asset.name} from balance`,
        );
        throw new NotFoundException(`Asset not found in user's balance`);
      }

      if (existingBalanceAsset.amount < amount) {
        this.logger.error(
          `Insufficient amount to reduce ${amount} from asset ${asset.name} for user ${userId} balance`,
        );
        throw new BadRequestException('Insufficient amount to remove');
      }
      existingBalanceAsset.amount -= amount;
      if (existingBalanceAsset.amount === 0) {
        this.logger.log(
          `Asset ${existingBalanceAsset.id} has been decreased to 0, removing asset entirely`,
        );
        await this.balanceRepository
          .createQueryBuilder('balance')
          .delete()
          .where('balance.user_id = :userId', { userId })
          .andWhere('balance.asset_id = :assetId', {
            assetId: existingBalanceAsset.asset_id,
          })
          .execute();
      } else {
        await this.balanceRepository.save(existingBalanceAsset);
      }

      const message = `Successfully removed asset ${asset.name} by ${amount} to user ${userId}'s balance`;
      this.logger.log(message);
    } catch (error) {
      this.logger.error(
        `Failed to remove asset for user ${userId}: ${error?.message ?? ''}`,
      );
      throw error;
    }
  }

  async getBalancesValues(
    userId: number,
    currency: string,
  ): Promise<UserBalance> {
    const res: UserBalance = {
      userId,
      assets: [],
    };

    const userBalanceAssets = await this.balanceRepository
      .createQueryBuilder('balance')
      .innerJoinAndSelect('balance.asset', 'asset')
      .where('balance.user_id = :userId', { userId })
      .getMany();

    if (userBalanceAssets.length === 0) return res;

    const assetIds = userBalanceAssets
      .map(({ asset }) => asset.search_id)
      .join(',');
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
    for (const { asset: assetInfo, amount } of userBalanceAssets) {
      const resultAsset: BalanceAsset = {
        assetInfo: { ...assetInfo },
        amount,
      };
      if (!ratesMap.has(assetInfo.search_id)) {
        resultAsset.valueInCurrency = 0;
        break;
      }
      const rate = ratesMap.get(assetInfo.search_id);
      resultAsset.valueInCurrency = this.calculateBalanceValue(amount, rate);
      res.assets.push(resultAsset);
    }

    const message = `Successfully balance values with currency ${currency} to user ${userId}`;
    this.logger.log(message);
    return res;
  }

  async getTotalBalance(userId: number, currency: string): Promise<number> {
    const { assets } = await this.getBalancesValues(userId, currency);
    if (assets.length === 0) return 0;
    const totalBalance = this.calculateTotalBalanceValue(assets);
    const message = `Successfully calculated total balance value with currency ${currency} to user ${userId}`;
    this.logger.log(message);
    return totalBalance;
  }

  async rebalance(
    userId: number,
    currency: string,
    targetPercentages: Record<string, number>,
  ): Promise<void> {
    try {
      const { assets: balanceAssets } = await this.getBalancesValues(
        userId,
        currency,
      );
      if (balanceAssets.length === 0) {
        this.logger.error('There are no values to rebalance');
        throw new NotFoundException('Nothing to rebalance');
      }

      const assetsToRebalance = balanceAssets.filter(
        ({ assetInfo }) => assetInfo.search_id in targetPercentages,
      );
      if (assetsToRebalance.length < balanceAssets.length) {
        this.logger.warn(
          'Some assets are not included in the rebalance process and will be ignored',
        );
      }
      if (assetsToRebalance.length < Object.keys(targetPercentages).length) {
        this.logger.error(
          "There are assets from target percentages that are not in user's balance",
        );
        throw new BadRequestException('Please include only assets you have');
      }
      const invalidAssetIds = assetsToRebalance
        .filter((asset) => asset.valueInCurrency === 0)
        .map(({ assetInfo }) => assetInfo.search_id);
      if (invalidAssetIds.length > 0) {
        this.logger.error('Invalid assets to be rebalanced');
        throw new BadRequestException(
          `Cannot rebalance. The following assets are not supported or invalid: ${invalidAssetIds.join(',')}`,
        );
      }

      const totalValue = this.calculateTotalBalanceValue(assetsToRebalance);
      for (const { valueInCurrency, amount, assetInfo } of assetsToRebalance) {
        const targetPercentage = targetPercentages[assetInfo.search_id];
        const targetValue = totalValue * (targetPercentage / 100);
        const rate = valueInCurrency / amount;
        const newAmount = targetValue / rate;

        await this.balanceRepository
          .createQueryBuilder('balance')
          .update()
          .set({ amount: newAmount })
          .where('balance.user_id = :userId', { userId })
          .andWhere('balance.asset_id = :assetId', { assetId: assetInfo.id })
          .execute();

        const deltaToChange = Math.abs(amount - newAmount);
        if (newAmount > amount) {
          this.logger.log(
            `Increasing asset ${assetInfo.name} for user ${userId} by ${deltaToChange} units.`,
          );
        } else {
          this.logger.log(
            `Decreasing asset ${assetInfo.name} for user ${userId} by ${deltaToChange} units.`,
          );
        }
      }
      this.logger.log(`Rebalance completed successfully for user ${userId}.`);
    } catch (error) {
      this.logger.error(
        `Failed to rebalance assets for user ${userId}: ${error?.message ?? ''}`,
      );
      throw error;
    }
  }

  private async getBalanceAsset(
    userId: number,
    assetId: number,
  ): Promise<Omit<Balance, 'asset'> | null> {
    return this.balanceRepository
      .createQueryBuilder('balance')
      .where('balance.user_id = :userId', { userId })
      .andWhere('balance.asset_id = :assetId', { assetId })
      .getOne();
  }

  private calculateTotalBalanceValue(assets: BalanceAsset[]): number {
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
