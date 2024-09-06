import { AppLoggerService } from '@app/shared';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  MicroserviceOptions,
  RpcException,
  Transport,
} from '@nestjs/microservices';
import { RateModule } from './rate.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    RateModule,
    {
      transport: Transport.TCP,
      options: {
        host: 'localhost',
        port: 3002,
      },
      bufferLogs: true,
    },
  );
  app.useLogger(new AppLoggerService());
  app.useGlobalPipes(
    new ValidationPipe({
      forbidUnknownValues: true,
      exceptionFactory: (errors) =>
        new RpcException(new BadRequestException(errors)),
    }),
  );
  await app.listen();

  const logger = new AppLoggerService();
  logger.setContext(RateModule.name);
  logger.log('Rate service is listening for requests.');
}
bootstrap();
