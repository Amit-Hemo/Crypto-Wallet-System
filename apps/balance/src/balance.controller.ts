import { GetBalanceDTO } from '@app/shared/dto/balance/balance.dto';
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { BalanceService } from './balance.service';

@Controller('balance')
export class BalanceController {
  constructor(private readonly balanceService: BalanceService) {}

  @MessagePattern({ cmd: 'get_balance' })
  getBalance(data: GetBalanceDTO): string {
    return this.balanceService.getBalanceWithId(data.balanceId, data.userId);
  }
}
