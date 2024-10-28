import { AppLoggerModule, FileManagementModule } from '@app/shared';
import { AllExceptionsFilter } from '@app/shared/error-handling/http-exception/http-exception.filter';
import { GlobalRpcExceptionFilter } from '@app/shared/error-handling/rpc-exception/rpc-exception.filter';
import { Services } from '@app/shared/general/services.contants';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { ClientsModule, Transport } from '@nestjs/microservices';
import * as joi from 'joi';
import * as path from 'path';
import { BalanceController } from './balance.controller';
import { BalanceService } from './balance.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: path.join('apps', 'balance', '.env'),
      isGlobal: true,
      validationSchema: joi.object({
        PORT: joi.number().port().default(3001),
      }),
    }),
    FileManagementModule,
    AppLoggerModule,
    ClientsModule.register([
      {
        name: Services.RATE,
        transport: Transport.TCP,
        options: {
          host: 'rate-service',
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
