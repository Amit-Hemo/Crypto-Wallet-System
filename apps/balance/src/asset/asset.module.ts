import { AppLoggerModule } from '@app/shared';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asset } from '../entities/Asset';
import { AssetService } from './asset.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Asset]),
    AppLoggerModule,
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 2,
    }),
    ScheduleModule.forRoot(),
  ],
  providers: [AssetService],
  exports: [AssetService],
})
export class AssetModule {}
