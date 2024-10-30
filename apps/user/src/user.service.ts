import { User } from '@app/shared/interfaces/user.interface';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
  private users: User[];

  constructor() {
    this.users = [
      {
        id: 1,
        email: 'amit@gmail.com',
        username: 'amithemo12',
      },
      {
        id: 2,
        email: 'noam@gmail.com',
        username: 'noamhemop',
      },
    ];
  }

  getAllUsers(): User[] {
    return this.users;
  }

  getUserById(id: number): User {
    return this.users.find((user) => user.id === id);
  }

  getUserByEmail(email: string) {
    return this.users.find((user) => user.email === email);
  }
}
