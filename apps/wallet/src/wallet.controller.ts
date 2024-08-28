import { Controller, Get, Headers, Param } from '@nestjs/common';
import { WalletService } from './wallet.service';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('/')
  getHello(): string {
    return 'hello from wallet service';
  }

  @Get('/:walletId')
  getWallet(
    @Headers('X-User-ID') userId: string,
    @Param('walletId') walletId: string,
  ): string {
    return this.walletService.getWalletWithId(walletId, userId);
  }
}
