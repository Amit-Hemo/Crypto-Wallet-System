import { AppLoggerService } from '@app/shared';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  MicroserviceOptions,
  RpcException,
  Transport,
} from '@nestjs/microservices';
import { UserModule } from './user.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(UserModule);
  const configService = app.get(ConfigService);

  const microservice =
    await NestFactory.createMicroservice<MicroserviceOptions>(UserModule, {
      transport: Transport.TCP,
      options: {
        host: 'user-service',
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
  logger.log('User service is listening for requests.');
}
bootstrap();
