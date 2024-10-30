import { AppLoggerModule } from '@app/shared';
import { AllExceptionsFilter } from '@app/shared/error-handling/http-exception/http-exception.filter';
import { GlobalRpcExceptionFilter } from '@app/shared/error-handling/rpc-exception/rpc-exception.filter';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import * as joi from 'joi';
import * as path from 'path';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: path.join('apps', 'user', '.env'),
      cache: true,
      isGlobal: true,
      validationSchema: joi.object({
        PORT: joi.number().port().default(3003),
      }),
    }),
    AppLoggerModule,
  ],
  controllers: [UserController],
  providers: [
    UserService,
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
export class UserModule {}
