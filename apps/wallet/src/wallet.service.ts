import { Injectable } from '@nestjs/common';

@Injectable()
export class WalletService {
  getWalletWithId(walletId: string): string {
    return `Hello from wallet with id ${walletId}`;
  }
}
