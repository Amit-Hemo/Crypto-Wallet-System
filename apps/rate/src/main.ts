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
        host: 'rate-service',
        port: (process.env.PORT || 3002) as number,
      },
      bufferLogs: true,
    },
  );
  app.useGlobalPipes(
    new ValidationPipe({
      forbidUnknownValues: true,
      exceptionFactory: (errors) =>
        new RpcException(new BadRequestException(errors)),
    }),
  );
  const logger = await app.resolve(AppLoggerService);
  app.useLogger(logger);

  await app.listen();
  logger.log('Rate service is listening for requests.');
}
bootstrap();
