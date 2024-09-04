import { Injectable } from '@nestjs/common';

@Injectable()
export class BalanceService {
  getBalanceWithId(balanceId: string, userId: string): string {
    return `Hello from balance with id ${balanceId} of user: ${userId}`;
  }
}
