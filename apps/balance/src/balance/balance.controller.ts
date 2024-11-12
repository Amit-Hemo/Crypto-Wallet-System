import { AppLoggerService } from '@app/shared';
import { SuccessResponse } from '@app/shared/api/responses';
import { AddAssetPayloadDto } from '@app/shared/dto/add-asset.dto';
import { BalanceValueDto } from '@app/shared/dto/balance-value.dto';
import { RebalancePayloadDto } from '@app/shared/dto/rebalance.dto';
import { RemoveAssetPayloadDto } from '@app/shared/dto/remove-asset.dto';
import { MessagePatterns } from '@app/shared/general/message-patterns.constants';
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

  @MessagePattern({ cmd: MessagePatterns.ADD_ASSET })
  async addAssetToBalance(@Payload() payload: AddAssetPayloadDto) {
    const { userId, searchId: assetSearchId, amount } = payload;
    this.logger.log(`Received request to add/update asset for user ${userId}`);
    try {
      await this.balanceService.addAssetToBalance(
        userId,
        assetSearchId,
        amount,
      );

      const message = `Successfully added asset ${assetSearchId} for user ${userId}`;
      this.logger.log(message);
      return new SuccessResponse(message);
    } catch (error) {
      this.logger.error(
        `Error processing request for user ${userId}: ${error.message}`,
      );
      if (error instanceof RpcException) throw error;
      throw new RpcException(error);
    }
  }

  @MessagePattern({ cmd: MessagePatterns.REMOVE_ASSET })
  async removeAssetFromBalance(@Payload() payload: RemoveAssetPayloadDto) {
    const { userId, searchId: assetSearchId, amount } = payload;
    this.logger.log(`Received request to remove asset for user ${userId}`);
    try {
      await this.balanceService.removeAssetFromBalance(
        userId,
        assetSearchId,
        amount,
      );

      const message = `Successfully removed asset ${assetSearchId} for user ${userId}`;
      this.logger.log(message);
      return new SuccessResponse(message);
    } catch (error) {
      this.logger.error(
        `Error processing request for user ${userId}: ${error.message}`,
      );
      if (error instanceof RpcException) throw error;
      throw new RpcException(error);
    }
  }

  @MessagePattern({ cmd: MessagePatterns.GET_BALANCE })
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

  @MessagePattern({ cmd: MessagePatterns.GET_TOTAL_BALANCE_VALUE })
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

  @MessagePattern({ cmd: MessagePatterns.REBALANCE })
  async rebalance(@Payload() payload: RebalancePayloadDto) {
    const { userId, currency, targetPercentages } = payload;
    this.logger.log(`Received request to rebalance from user ${userId}`);
    try {
      await this.balanceService.rebalance(userId, currency, targetPercentages);

      const message = `Successfully rebalanced user ${userId} balance`;
      this.logger.log(message);
      return new SuccessResponse(message);
    } catch (error) {
      this.logger.error(
        `Error processing request for user ${userId}: ${error.message}`,
      );
      if (error instanceof RpcException) throw error;
      throw new RpcException(error);
    }
  }
}
