import { AppLoggerModule, FileManagementModule } from '@app/shared';
import { AllExceptionsFilter } from '@app/shared/error-handling/http-exception/http-exception.filter';
import { GlobalRpcExceptionFilter } from '@app/shared/error-handling/rpc-exception/rpc-exception.filter';
import { serviceNames } from '@app/shared/general/service-names';
import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
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
  providers: [
    BalanceService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalRpcExceptionFilter,
    },
  ],
})
export class BalanceModule {}
