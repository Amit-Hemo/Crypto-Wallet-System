import { AppLoggerModule, FileManagementModule } from '@app/shared';
import { Services } from '@app/shared/general/services.contants';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetModule } from '../asset/asset.module';
import { Asset } from '../entities/Asset';
import { Balance } from '../entities/Balance';
import { BalanceController } from './balance.controller';
import { BalanceService } from './balance.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: Services.RATE,
        transport: Transport.TCP,
        options: {
          host: 'rate-service',
          port: 3002,
        },
      },
    ]),
    FileManagementModule,
    AppLoggerModule,
    TypeOrmModule.forFeature([Balance, Asset]),
    AssetModule,
  ],
  controllers: [BalanceController],
  providers: [BalanceService],
  exports: [BalanceService],
})
export class BalanceModule {}
