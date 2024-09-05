import { AppLoggerModule, FileManagementModule } from '@app/shared';
import { Module } from '@nestjs/common';
import { BalanceController } from './balance.controller';
import { BalanceService } from './balance.service';

@Module({
  imports: [FileManagementModule, AppLoggerModule],
  controllers: [BalanceController],
  providers: [BalanceService],
})
export class BalanceModule {}
