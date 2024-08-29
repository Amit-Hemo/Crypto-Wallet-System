import { GetRateDTO } from '@app/shared/dto/rate/rate.dto';
import { GetWalletDTO } from '@app/shared/dto/wallet/wallet.dto';
import { Controller, Get, Headers, Param, UseGuards } from '@nestjs/common';
import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';
import { AuthGuard } from './auth.guard';

@UseGuards(AuthGuard)
@Controller()
export class AppController {
  private clientWalletService: ClientProxy;
  private clientRateService: ClientProxy;
  constructor() {
    this.clientWalletService = ClientProxyFactory.create({
      transport: Transport.TCP,
      options: {
        host: 'localhost',
        port: 3001,
      },
    });
    this.clientRateService = ClientProxyFactory.create({
      transport: Transport.TCP,
      options: {
        host: 'localhost',
        port: 3002,
      },
    });
  }

  @Get('/')
  getHello(): string {
    return 'hello';
  }

  @Get('/wallet/:walletId')
  async getWallet(
    @Param('walletId') walletId: string,
    @Headers('X-User-ID') userId: string,
  ) {
    const payload: GetWalletDTO = { walletId, userId };
    return this.clientWalletService.send({ cmd: 'get_wallet' }, payload);
  }

  @Get('/rate/:currency')
  async getCryptoRate(
    @Param('currency') currency: string,
    @Headers('X-User-ID') userId: string,
  ) {
    const payload: GetRateDTO = { userId, currency };
    return this.clientRateService.send({ cmd: 'get_rate' }, payload);
  }
}
