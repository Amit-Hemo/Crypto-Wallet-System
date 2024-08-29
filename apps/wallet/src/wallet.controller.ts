import { GetWalletDTO } from '@app/shared/dto/wallet/wallet.dto';
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { WalletService } from './wallet.service';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @MessagePattern({ cmd: 'get_wallet' })
  getWallet(data: GetWalletDTO): string {
    return this.walletService.getWalletWithId(data.walletId, data.userId);
  }
}
