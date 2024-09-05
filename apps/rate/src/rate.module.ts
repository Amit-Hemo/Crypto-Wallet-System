import { Module } from '@nestjs/common';
import { RateController } from './rate.controller';
import { RateService } from './rate.service';
import { AppLoggerModule } from '@app/shared';

@Module({
  imports: [AppLoggerModule],
  controllers: [RateController],
  providers: [RateService],
})
export class RateModule {}
