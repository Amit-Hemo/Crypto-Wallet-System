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
import { MessagePatterns } from '@app/shared/general/message-patterns.constants';
import { Routes } from '@app/shared/general/routes.constants';
import { Services } from '@app/shared/general/services.contants';
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
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth.guard';

@ApiTags('balance')
@UseGuards(AuthGuard)
@Controller(Routes.BALANCES)
export class BalanceController {
  @Inject(Services.BALANCE)
  private readonly clientBalanceService: ClientProxy;
  constructor() {}

  /**
   * Add a new asset to the user's balance or add to an existing one by amount
   * @param userId - The ID of the user
   * @param assetDto - The asset data
   */
  @Put('assets')
  async addAssetToBalance(
    @Headers('X-User-ID') userId: number,
    @Body() assetDto: AddAssetDto,
  ) {
    const payload: AddAssetPayloadDto = { ...assetDto, userId: Number(userId) };
    return this.clientBalanceService.send(
      { cmd: MessagePatterns.ADD_ASSET },
      payload,
    );
  }

  /**
   * Decrease by amount (auto remove when empty) an asset from the user's balance
   * @param userId - The ID of the user
   * @param searchId - The id of the asset to remove (search id = id of the asset that is used to search in the external API)
   * @param body - The amount to remove
   */
  @Patch('assets/:searchId')
  async removeAssetFromBalance(
    @Headers('X-User-ID') userId: number,
    @Param('searchId') searchId: string,
    @Body() body: RemoveAssetDto,
  ) {
    const payload: RemoveAssetPayloadDto = {
      ...body,
      searchId,
      userId: Number(userId),
    };
    return this.clientBalanceService.send(
      { cmd: MessagePatterns.REMOVE_ASSET },
      payload,
    );
  }

  /**
   * Retrieve balance assets with their values against given currency for a user
   * @param userId - The ID of the user (sent in the header)
   * @param currency - The currency for which to retrieve the balance values
   * @returns User balance
   */
  @Get('assets')
  async getBalancesValues(
    @Headers('X-User-ID') userId: number,
    @Query('currency') currency: string,
  ) {
    const payload: BalanceValueDto = { userId: Number(userId), currency };
    return this.clientBalanceService.send(
      { cmd: MessagePatterns.GET_BALANCE },
      payload,
    );
  }

  /**
   * Get the total balance value in the specified currency
   * @param userId - The ID of the user
   * @param currency - The currency for the total balance value
   * @returns The total balance value
   */
  @Get('total')
  async getTotalBalance(
    @Headers('X-User-ID') userId: number,
    @Query('currency') currency: string,
  ) {
    const payload: BalanceValueDto = { userId: Number(userId), currency };
    return this.clientBalanceService.send(
      { cmd: MessagePatterns.GET_TOTAL_BALANCE_VALUE },
      payload,
    );
  }

  /**
   * Adjusts the user's holdings to match specified target percentages of total value across all assets
   * @param userId The ID of the user
   * @param currency The currency for the total balance value
   * @param targetPercentages This is how the selected assets should be adjusted
   */
  @Put('rebalance')
  async rebalance(
    @Headers('X-User-ID') userId: number,
    @Query('currency') currency: string,
    @Body() targetPercentages: TargetPercentagesDto,
  ) {
    const payload: RebalancePayloadDto = {
      userId: Number(userId),
      currency: currency || 'usd', //usd is a common default currency around the world
      targetPercentages: targetPercentages.targetPercentages,
    };

    return this.clientBalanceService.send(
      { cmd: MessagePatterns.REBALANCE },
      payload,
    );
  }
}
