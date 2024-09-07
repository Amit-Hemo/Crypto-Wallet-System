import { AppLoggerService } from '@app/shared';
import { SuccessResponse } from '@app/shared/api/responses';
import { AddAssetPayloadDto } from '@app/shared/dto/add-asset.dto';
import { BalanceValueDto } from '@app/shared/dto/balance-value.dto';
import { RemoveAssetPayloadDto } from '@app/shared/dto/remove-asset.dto';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { BalanceService } from './balance.service';

@Controller()
export class BalanceController {
  constructor(
    private readonly balanceService: BalanceService,
    private readonly logger: AppLoggerService,
  ) {
    logger.setContext(BalanceController.name);
  }

  @MessagePattern({ cmd: 'get_balance' })
  async getBalancesValues(@Payload() payload: BalanceValueDto) {
    const { userId, currency } = payload;
    this.logger.log(`Received request to get user balance for ${userId}`);
    try {
      const userBalance = await this.balanceService.getBalancesValues(
        userId,
        currency,
      );
      const message = `Successfully retrieved user balance for user ${userId}`;
      this.logger.log(message);
      return new SuccessResponse(message, userBalance);
    } catch (error) {
      this.logger.error(
        `Error processing request for user ${userId}: ${error.message}`,
      );
      if (error instanceof RpcException) throw error;
      throw new RpcException(error);
    }
  }

  @MessagePattern({ cmd: 'add_asset' })
  async addAssetToBalance(@Payload() payload: AddAssetPayloadDto) {
    const { userId, ...asset } = payload;
    this.logger.log(`Received request to add/update asset for user ${userId}`);
    try {
      const updatedBalance = await this.balanceService.addAssetToBalance(
        userId,
        asset,
      );

      const message = `Successfully added asset ${asset.id} for user ${userId}`;
      this.logger.log(message);
      return new SuccessResponse(message, updatedBalance);
    } catch (error) {
      this.logger.error(
        `Error processing request for user ${userId}: ${error.message}`,
      );
      throw error;
    }
  }

  @MessagePattern({ cmd: 'remove_asset' })
  async removeAssetFromBalance(@Payload() payload: RemoveAssetPayloadDto) {
    const { userId, id: assetId, amount } = payload;
    this.logger.log(`Received request to remove asset for user ${userId}`);
    try {
      await this.balanceService.removeAssetFromBalance(userId, assetId, amount);

      const message = `Successfully removed asset ${assetId} for user ${userId}`;
      this.logger.log(message);
      return new SuccessResponse(message);
    } catch (error) {
      this.logger.error(
        `Error processing request for user ${userId}: ${error.message}`,
      );
      throw error;
    }
  }

  @MessagePattern({ cmd: 'get_total_balance_value' })
  async getTotalBalance(@Payload() payload: BalanceValueDto) {
    const { userId, currency } = payload;
    this.logger.log(`Received request get total balance for user ${userId}`);
    try {
      const totalBalance = await this.balanceService.getTotalBalance(
        userId,
        currency,
      );

      const message = `Successfully calculated total balance value for user ${userId}`;
      this.logger.log(message);
      return new SuccessResponse(message, totalBalance);
    } catch (error) {
      this.logger.error(
        `Error processing request for user ${userId}: ${error.message}`,
      );
      if (error instanceof RpcException) throw error;
      throw new RpcException(error);
    }
  }
}
