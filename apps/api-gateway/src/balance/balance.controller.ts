import { AuthUser } from '@app/shared/decorators/auth-user.decorator';
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
import { AuthenticatedUser } from '@app/shared/interfaces/auth.interface';
import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('balance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller(Routes.BALANCES)
export class BalanceController {
  constructor(
    @Inject(Services.BALANCE)
    private readonly clientBalanceService: ClientProxy,
  ) {}

  /**
   * Adds a new asset to the user's balance or adds to an existing one by amount
   * @param user Authenticated user after providing valid credentials
   * @param assetDto - The asset data
   */
  @Put('assets')
  async addAssetToBalance(
    @AuthUser() user: AuthenticatedUser,
    @Body() assetDto: AddAssetDto,
  ) {
    const payload: AddAssetPayloadDto = { ...assetDto, userId: user.id };
    return this.clientBalanceService.send(
      { cmd: MessagePatterns.ADD_ASSET },
      payload,
    );
  }

  /**
   * Decreases by amount (auto remove when empty) an asset from the user's balance
   * @paramuser Authenticated user after providing valid credentials
   * @param searchId - The id of the asset to remove (search id = id of the asset that is used to search in the external API)
   * @param body - The amount to remove
   */
  @Patch('assets/:searchId')
  async removeAssetFromBalance(
    @AuthUser() user: AuthenticatedUser,
    @Param('searchId') searchId: string,
    @Body() body: RemoveAssetDto,
  ) {
    const payload: RemoveAssetPayloadDto = {
      ...body,
      searchId,
      userId: user.id,
    };
    return this.clientBalanceService.send(
      { cmd: MessagePatterns.REMOVE_ASSET },
      payload,
    );
  }

  /**
   * Retrieve balance assets with their values against given currency for a user
   * @param user Authenticated user after providing valid credentials
   * @param currency - The currency for which to retrieve the balance values
   * @returns User balance with the balance values for each asset against provided currency
   */
  @Get('assets')
  async getBalancesValues(
    @AuthUser() user: AuthenticatedUser,
    @Query('currency') currency: string,
  ) {
    const payload: BalanceValueDto = { userId: user.id, currency };
    return this.clientBalanceService.send(
      { cmd: MessagePatterns.GET_BALANCE },
      payload,
    );
  }

  /**
   * Get the total balance value in the specified currency
   * @param user Authenticated user after providing valid credentials
   * @param currency - The currency for the total balance value
   * @returns The total balance value
   */
  @Get('total')
  async getTotalBalance(
    @AuthUser() user: AuthenticatedUser,
    @Query('currency') currency: string,
  ) {
    const payload: BalanceValueDto = { userId: user.id, currency };
    return this.clientBalanceService.send(
      { cmd: MessagePatterns.GET_TOTAL_BALANCE_VALUE },
      payload,
    );
  }

  /**
   * Adjusts the user's holdings to match specified target percentages of total value across all assets
   * @param user Authenticated user after providing valid credentials
   * @param currency The currency for the total balance value
   * @param targetPercentages This is how the selected assets should be adjusted, make sure the percentages are in range 0-100 (non inclusive)
   */
  @Put('rebalance')
  async rebalance(
    @AuthUser() user: AuthenticatedUser,
    @Query('currency') currency: string,
    @Body() targetPercentages: TargetPercentagesDto,
  ) {
    const DEFAULT_CURRENCY = 'usd';
    const payload: RebalancePayloadDto = {
      userId: user.id,
      currency: currency || DEFAULT_CURRENCY, //usd is a common default currency around the world
      targetPercentages: targetPercentages.targetPercentages,
    };

    return this.clientBalanceService.send(
      { cmd: MessagePatterns.REBALANCE },
      payload,
    );
  }
}
