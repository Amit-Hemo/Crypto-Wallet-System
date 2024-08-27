import { Injectable } from '@nestjs/common';

@Injectable()
export class RateService {
  getHello(): string {
    return 'Hello from rate service';
  }

  getCryptoRate(cryptoSymbol: string): string {
    return `for crypto with type: ${cryptoSymbol}, the rate is: 45.343`;
  }
}
