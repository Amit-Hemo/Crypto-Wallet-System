import { AppLoggerService } from '@app/shared';
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
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document);

  const PORT = (process.env.PORT || 3000) as number;
  const logger = new AppLoggerService();
  logger.setContext(AppModule.name);
  await app.listen(3000, () => {
    logger.log(`Listening on port ${PORT}`);
  });
}
bootstrap();
