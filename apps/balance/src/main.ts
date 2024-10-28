import { AppLoggerService } from '@app/shared';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  MicroserviceOptions,
  RpcException,
  Transport,
} from '@nestjs/microservices';
import { BalanceModule } from './balance.module';

async function bootstrap() {
  const app = await NestFactory.create(BalanceModule, { bufferLogs: true });
  const configService = app.get(ConfigService);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: 'balance-service',
      port: configService.get<number>('PORT'),
    },
  });

  app.useGlobalPipes(
    new ValidationPipe({
      forbidUnknownValues: true,
      exceptionFactory: (errors) =>
        new RpcException(new BadRequestException(errors)),
    }),
  );

  const logger = await app.resolve(AppLoggerService);
  app.useLogger(logger);

  await app.startAllMicroservices();
  logger.log('Balance service is listening for requests.');
}
bootstrap();
