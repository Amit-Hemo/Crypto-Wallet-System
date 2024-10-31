import { AppLoggerService } from '@app/shared';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  MicroserviceOptions,
  RpcException,
  Transport,
} from '@nestjs/microservices';
import { RateModule } from './rate.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(RateModule);
  const configService = app.get(ConfigService);

  const microservice =
    await NestFactory.createMicroservice<MicroserviceOptions>(RateModule, {
      transport: Transport.TCP,
      options: {
        host: 'rate-service',
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
  logger.log('Rate service is listening for requests.');
}
bootstrap();
