import { AppLoggerService } from '@app/shared';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { BalanceModule } from './balance.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    BalanceModule,
    {
      transport: Transport.TCP,
      options: {
        host: 'localhost',
        port: 3001,
      },
      bufferLogs: true,
    },
  );
  app.useLogger(new AppLoggerService());

  await app.listen();
  console.log('balance service is listening');
}
bootstrap();
