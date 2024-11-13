import { AppLoggerModule } from '@app/shared';
import { AllExceptionsFilter } from '@app/shared/error-handling/http-exception/http-exception.filter';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import * as joi from 'joi';
import * as path from 'path';
import { AuthModule } from './auth/auth.module';
import { BalanceModule } from './balance/balance.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: path.join('apps', 'api-gateway', '.env'),
      isGlobal: true,
      validationSchema: joi.object({
        PORT: joi.number().port().default(3000),
      }),
    }),
    AppLoggerModule,
    BalanceModule,
    UserModule,
    AuthModule,
    ThrottlerModule.forRoot([
      {
        ttl: 15 * 60 * 1000,
        limit: 100,
      },
    ]),
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
