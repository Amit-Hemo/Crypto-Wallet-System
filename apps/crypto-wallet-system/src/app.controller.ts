import { HttpService } from '@nestjs/axios';
import { Controller, Get, Headers, Param, UseGuards } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { AuthGuard } from './auth.guard';

@UseGuards(AuthGuard)
@Controller('/api/v1')
export class AppController {
  constructor(private readonly httpService: HttpService) {}

  @Get('/')
  getHello(): string {
    return 'hello';
  }

  @Get('/wallet/:walletId')
  async getWallet(
    @Param('walletId') walletId: string,
    @Headers('X-User-ID') userId: string,
  ): Promise<string> {
    const response = await lastValueFrom(
      this.httpService.get<string>(`http://localhost:3001/wallet/${walletId}`, {
        headers: { 'X-User-ID': userId },
      }),
    );
    return response.data;
  }

  @Get('/rate/:cryptoSymbol')
  async getCryptoRate(
    @Param('cryptoSymbol') cryptoSymbol: string,
    @Headers('X-User-ID') userId: string,
  ): Promise<string> {
    const response = await lastValueFrom(
      this.httpService.get<string>(
        `http://localhost:3002/rate/${cryptoSymbol}`,
        { headers: { 'X-User-ID': userId } },
      ),
    );
    return response.data;
  }
}
