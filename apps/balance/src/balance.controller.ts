import { AppLoggerService } from '@app/shared';
import { SuccessResponse } from '@app/shared/api/responses';
import { AddAssetPayloadDto } from '@app/shared/dto/add-asset.dto';
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

  @MessagePattern({ cmd: 'add_asset' })
  async addAssetToBalance(@Payload() payload: AddAssetPayloadDto) {
    const { userId, ...asset } = payload;
    this.logger.log(`Received request to add/update asset for user ${userId}`);
    try {
      const updatedBalance = await this.balanceService.addAssetToBalance(
        userId,
        asset,
      );

      const message = `Successfully added asset ${asset.name} for user ${userId}`;
      this.logger.log(message);
      return new SuccessResponse(message, updatedBalance);
    } catch (error) {
      this.logger.error(
        `Error processing request for user ${userId}: ${error.message}`,
      );
      throw new RpcException('Failed to add asset to the user');
    }
  }
}
