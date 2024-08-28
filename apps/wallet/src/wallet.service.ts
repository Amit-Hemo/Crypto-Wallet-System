import { Injectable } from '@nestjs/common';

@Injectable()
export class WalletService {
  getWalletWithId(walletId: string, userId: string): string {
    return `Hello from wallet with id ${walletId} of user: ${userId}`;
  }
}
