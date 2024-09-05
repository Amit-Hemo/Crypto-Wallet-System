import { AppLoggerService } from '@app/shared';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RateService {
  constructor(private readonly logger: AppLoggerService) {
    this.logger.setContext(RateService.name);
  }

  getHello(): string {
    return 'Hello from rate service';
  }

  getCryptoRate(cryptoSymbol: string, userId: string): string {
    return `user ${userId} searched for crypto with type: ${cryptoSymbol}, the rate is: 45.343`;
  }
}
