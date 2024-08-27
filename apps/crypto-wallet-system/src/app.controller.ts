import { HttpService } from '@nestjs/axios';
import { Controller, Get, Param } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';

@Controller('/api')
export class AppController {
  constructor(private readonly httpService: HttpService) {}

  @Get('/')
  getHello(): string {
    return 'hello';
  }

  @Get('/wallet/:walletId')
  async getWallet(@Param('walletId') walletId: string): Promise<string> {
    const response = await lastValueFrom(
      this.httpService.get<string>(`http://localhost:3001/wallet/${walletId}`),
    );
    return response.data;
  }

  @Get('/rate/:cryptoSymbol')
  async getCryptoRate(
    @Param('cryptoSymbol') cryptoSymbol: string,
  ): Promise<string> {
    const response = await lastValueFrom(
      this.httpService.get<string>(
        `http://localhost:3002/rate/${cryptoSymbol}`,
      ),
    );
    return response.data;
  }
}
