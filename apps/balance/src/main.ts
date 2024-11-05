import { AppLoggerService } from '@app/shared';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  MicroserviceOptions,
  RpcException,
  Transport,
} from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const configService = app.get(ConfigService);

  const microservice =
    await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
      transport: Transport.TCP,
      options: {
        host: 'balance-service',
        port: configService.get<number>('PORT'),
      },
      bufferLogs: true,
    });

  microservice.useGlobalPipes(
    new ValidationPipe({
      forbidUnknownValues: true,
      exceptionFactory: (errors) =>
        new RpcException(new BadRequestException(errors)),
    }),
  );

  const logger = await microservice.resolve(AppLoggerService);
  microservice.useLogger(logger);

  await microservice.listen();
  logger.log('Balance service is listening for requests.');
}
bootstrap();
