import { AppLoggerService } from '@app/shared';
import { GetRatePayloadDto } from '@app/shared/dto/get-rate.dto';
import { MessagePatterns } from '@app/shared/general/message-patterns.constants';
import { RatesResponse } from '@app/shared/interfaces/rate.interface';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RateService } from './rate.service';

@Controller('rate')
export class RateController {
  constructor(
    private readonly rateService: RateService,
    private readonly logger: AppLoggerService,
  ) {
    logger.setContext(RateController.name);
  }

  @MessagePattern({ cmd: MessagePatterns.GET_RATE })
  async getCryptoRate(@Payload() data: GetRatePayloadDto) {
    const { assetIds, currency } = data;
    this.logger.log(`Received request to retrieve rate`);
    try {
      const response: RatesResponse = await this.rateService.getCryptoRate(
        assetIds.split(','),
        currency,
      );
      const message = `Successfully retrieved rates for currency ${currency}`;
      this.logger.log(message);
      return response;
    } catch (error) {
      this.logger.error(`Error processing request: ${error.message}`);
      throw error;
    }
  }
}
