import { Controller, Get, Param } from '@nestjs/common';
import { RateService } from './rate.service';

@Controller('rate')
export class RateController {
  constructor(private readonly rateService: RateService) {}

  @Get()
  getHello(): string {
    return this.rateService.getHello();
  }

  @Get('/:cryptoSymbol')
  getCryptoRate(@Param('cryptoSymbol') cryptoSymbol: string): string {
    return this.rateService.getCryptoRate(cryptoSymbol);
  }
}
