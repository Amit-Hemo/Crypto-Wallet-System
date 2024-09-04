import { GetBalanceDTO } from '@app/shared/dto/balance/balance.dto';
import { GetRateDTO } from '@app/shared/dto/rate/rate.dto';
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
  private clientBalanceService: ClientProxy;
  private clientRateService: ClientProxy;
  constructor() {
    this.clientBalanceService = ClientProxyFactory.create({
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

  @Get('/balance/:balanceId')
  async getBalance(
    @Param('balanceId') balanceId: string,
    @Headers('X-User-ID') userId: string,
  ) {
    const payload: GetBalanceDTO = { balanceId, userId };
    return this.clientBalanceService.send({ cmd: 'get_balance' }, payload);
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
