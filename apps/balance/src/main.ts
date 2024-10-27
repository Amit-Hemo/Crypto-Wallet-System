import { AppLoggerService } from '@app/shared';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  MicroserviceOptions,
  RpcException,
  Transport,
} from '@nestjs/microservices';
import { BalanceModule } from './balance.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    BalanceModule,
    {
      transport: Transport.TCP,
      options: {
        host: 'balance-service',
        port: 3001,
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
  logger.setContext(BalanceModule.name);
  logger.log('Balance service is listening for requests.');
}
bootstrap();
