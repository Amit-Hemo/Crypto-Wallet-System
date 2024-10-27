import { Services } from '@app/shared/general/services.contants';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { BalanceController } from './balance.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: Services.BALANCE,
        transport: Transport.TCP,
        options: {
          host: 'balance-service',
          port: 3001,
        },
      },
    ]),
  ],
  controllers: [BalanceController],
})
export class BalanceModule {}
