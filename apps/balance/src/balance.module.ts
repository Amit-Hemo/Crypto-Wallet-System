import { AppLoggerModule, FileManagementModule } from '@app/shared';
import { serviceNames } from '@app/shared/general/service-names';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { BalanceController } from './balance.controller';
import { BalanceService } from './balance.service';

@Module({
  imports: [
    FileManagementModule,
    AppLoggerModule,
    ClientsModule.register([
      {
        name: serviceNames.RATE,
        transport: Transport.TCP,
        options: {
          host: 'localhost',
          port: 3002,
        },
      },
    ]),
  ],
  controllers: [BalanceController],
  providers: [BalanceService],
})
export class BalanceModule {}
