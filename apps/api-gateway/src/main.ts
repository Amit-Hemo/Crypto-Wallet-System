import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('/api/v1');
  app.enableCors();
  app.use(helmet());
  const options = new DocumentBuilder()
    .setTitle('Crypto Balance System')
    .setDescription(
      'The system will allow users to manage their crypto holdings and view current valuations.',
    )
    .setVersion('1.0')
    .addTag('balance')
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();
