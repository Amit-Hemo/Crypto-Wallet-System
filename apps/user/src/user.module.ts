import { AppLoggerModule } from '@app/shared';
import { GlobalRpcExceptionFilter } from '@app/shared/error-handling/rpc-exception/rpc-exception.filter';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as joi from 'joi';
import * as path from 'path';
import { User } from './entities/User';
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
        DB_HOST: joi.string().trim().min(1).required(),
        DB_PORT: joi.number().port().required(),
        DB_USER: joi.string().trim().min(1).required(),
        DB_NAME: joi.string().trim().min(1).required(),
        DB_PASSWORD: joi.string().trim().min(1).required(),
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
        entities: [User],
        synchronize: true, // Disable in production
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User]),
    AppLoggerModule,
  ],
  controllers: [UserController],
  providers: [
    UserService,
    {
      provide: APP_FILTER,
      useClass: GlobalRpcExceptionFilter,
    },
  ],
})
export class UserModule {}
