import { AppLoggerModule } from '@app/shared';
import { discoverServicePath } from '@app/shared/general/service-path.util';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import * as path from 'path';
import { RateController } from './rate.controller';
import { RateService } from './rate.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: path.join(discoverServicePath(__dirname), '.env'),
      cache: true,
      isGlobal: true,
    }),
    AppLoggerModule,
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 2,
    }),
    CacheModule.register({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [RateController],
  providers: [RateService],
})
export class RateModule {}
