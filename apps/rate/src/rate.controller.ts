import { AppLoggerService } from '@app/shared';
import { SuccessResponse } from '@app/shared/api/responses';
import { GetRatePayloadDto } from '@app/shared/dto/get-rate.dto';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { RateService } from './rate.service';

@Controller('rate')
export class RateController {
  constructor(
    private readonly rateService: RateService,
    private readonly logger: AppLoggerService,
  ) {
    logger.setContext(RateController.name);
  }

  @MessagePattern({ cmd: 'get_rate' })
  async getCryptoRate(@Payload() data: GetRatePayloadDto) {
    const { id: assetId, currency } = data;
    this.logger.log(`Received request to retrieve rate`);
    try {
      const rate = await this.rateService.getCryptoRate(assetId, currency);
      const message = `Successfully retrieved rate`;
      this.logger.log(message);
      return new SuccessResponse(message, rate);
    } catch (error) {
      this.logger.error(`Error processing request: ${error.message}`);
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException('Failed to retrieve rate');
    }
  }
}
