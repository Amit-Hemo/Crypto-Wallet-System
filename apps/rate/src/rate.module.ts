import { AppLoggerModule } from '@app/shared';
import { AllExceptionsFilter } from '@app/shared/error-handling/http-exception/http-exception.filter';
import { GlobalRpcExceptionFilter } from '@app/shared/error-handling/rpc-exception/rpc-exception.filter';
import { discoverServicePath } from '@app/shared/general/service-path.util';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import * as path from 'path';
import { RateController } from './rate.controller';
import { RateService } from './rate.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: path.join(discoverServicePath(__dirname), '.env'),
      cache: true,
      isGlobal: true,
    }),
    AppLoggerModule,
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 2,
    }),
    CacheModule.register({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [RateController],
  providers: [
    RateService,
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
export class RateModule {}
