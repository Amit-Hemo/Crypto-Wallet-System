import { AddAssetDto, AddAssetPayloadDto } from '@app/shared/dto/add-asset.dto';
import { BalanceValueDto } from '@app/shared/dto/balance-value.dto';
import {
  RebalancePayloadDto,
  TargetPercentagesDto,
} from '@app/shared/dto/rebalance.dto';
import {
  RemoveAssetDto,
  RemoveAssetPayloadDto,
} from '@app/shared/dto/remove-asset.dto';
import { serviceNames } from '@app/shared/general/service-names';
import {
  Body,
  Controller,
  Get,
  Headers,
  Inject,
  Param,
  Patch,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AuthGuard } from './auth.guard';

@UseGuards(AuthGuard)
@Controller()
export class AppController {
  @Inject(serviceNames.BALANCE)
  private readonly clientBalanceService: ClientProxy;
  @Inject(serviceNames.RATE) private readonly clientRateService: ClientProxy;
  constructor() {}

  /**
   * Retrieve balance assets with their values against given currency for a user
   * @param userId - The ID of the user (sent in the header)
   * @param currency - The currency for which to retrieve the balance values
   * @returns User balance
   */
  @Get('/balances/assets')
  async getBalancesValues(
    @Headers('X-User-ID') userId: string,
    @Query('currency') currency: string,
  ) {
    const payload: BalanceValueDto = { userId, currency };
    return this.clientBalanceService.send({ cmd: 'get_balance' }, payload);
  }

  /**
   * Add a new asset to the user's balance or add to an existing one by amount
   * @param userId - The ID of the user
   * @param assetDto - The asset data
   */
  @Put('/balances/assets')
  async addAssetToBalance(
    @Headers('X-User-ID') userId: string,
    @Body() assetDto: AddAssetDto,
  ) {
    const payload: AddAssetPayloadDto = { ...assetDto, userId };
    return this.clientBalanceService.send({ cmd: 'add_asset' }, payload);
  }

  /**
   * Decrease by amount (auto remove when empty) an asset from the user's balance
   * @param userId - The ID of the user
   * @param assetId - The ID of the asset to remove
   * @param body - The amount to remove
   */
  @Patch('/balances/assets/:id')
  async removeAssetFromBalance(
    @Headers('X-User-ID') userId: string,
    @Param('id') assetId: string,
    @Body() body: RemoveAssetDto,
  ) {
    const payload: RemoveAssetPayloadDto = { ...body, id: assetId, userId };
    return this.clientBalanceService.send({ cmd: 'remove_asset' }, payload);
  }

  /**
   * Get the total balance value in the specified currency
   * @param userId - The ID of the user
   * @param currency - The currency for the total balance value
   * @returns The total balance value
   */
  @Get('/balances/total')
  async getTotalBalance(
    @Headers('X-User-ID') userId: string,
    @Query('currency') currency: string,
  ) {
    const payload: BalanceValueDto = { userId, currency };
    return this.clientBalanceService.send(
      { cmd: 'get_total_balance_value' },
      payload,
    );
  }

  /**
   * Adjusts the user's holdings to match specified target percentages of total value across all assets
   * @param userId The ID of the user
   * @param currency The currency for the total balance value
   * @param targetPercentages This is how the selected assets should be adjusted
   */
  @Put('balances/rebalance')
  async rebalance(
    @Headers('X-User-ID') userId: string,
    @Query('currency') currency: string,
    @Body() targetPercentages: TargetPercentagesDto,
  ) {
    const payload: RebalancePayloadDto = {
      userId,
      currency: currency || 'usd',
      targetPercentages: targetPercentages.targetPercentages,
    };

    return this.clientBalanceService.send({ cmd: 'rebalance' }, payload);
  }
}
