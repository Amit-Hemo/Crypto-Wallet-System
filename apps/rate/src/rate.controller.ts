import { GetRateDTO } from '@app/shared/dto/rate/rate.dto';
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { RateService } from './rate.service';

@Controller('rate')
export class RateController {
  constructor(private readonly rateService: RateService) {}

  @MessagePattern({ cmd: 'get_rate' })
  getCryptoRate(data: GetRateDTO): string {
    return this.rateService.getCryptoRate(data.currency, data.userId);
  }
}
