import { AppLoggerService } from '@app/shared';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
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

  await app.listen();
  console.log('rate service is listening');
}
bootstrap();
