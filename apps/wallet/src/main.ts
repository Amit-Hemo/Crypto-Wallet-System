import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { WalletModule } from './wallet.module';

async function bootstrap() {
  console.log('starting wallet service');
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    WalletModule,
    {
      transport: Transport.TCP,
      options: {
        host: 'localhost',
        port: 3001,
      },
    },
  );

  await app.listen();
  console.log('wallet service is listening');
}
bootstrap();
