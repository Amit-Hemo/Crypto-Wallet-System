import { AppLoggerModule } from '@app/shared';
import { AllExceptionsFilter } from '@app/shared/error-handling/http-exception/http-exception.filter';
import { GlobalRpcExceptionFilter } from '@app/shared/error-handling/rpc-exception/rpc-exception.filter';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as joi from 'joi';
import * as path from 'path';
import { AssetModule } from './asset/asset.module';
import { BalanceModule } from './balance/balance.module';
import { Asset } from './entities/Asset';
import { Balance } from './entities/Balance';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: path.join('apps', 'balance', '.env'),
      cache: true,
      isGlobal: true,
      validationSchema: joi.object({
        PORT: joi.number().port().default(3001),
        DB_HOST: joi.string().trim().min(1).required(),
        DB_PORT: joi.number().port().required(),
        DB_USER: joi.string().trim().min(1).required(),
        DB_NAME: joi.string().trim().min(1).required(),
        DB_PASSWORD: joi.string().trim().min(1).required(),
        COINGECKO_API_KEY: joi.string().trim().min(20).required(),
      }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: Number(configService.get<number>('DB_PORT')),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [Asset, Balance],
        synchronize: true, // Disable in production,
      }),
      inject: [ConfigService],
    }),
    AppLoggerModule,
    AssetModule,
    BalanceModule,
  ],
  providers: [
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
export class AppModule {}
