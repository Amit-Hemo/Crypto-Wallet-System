import { CreateUserDto } from '@app/shared/dto/create-user.dto';
import { UserEmailDto } from '@app/shared/dto/user-email.dto';
import { UserIdDto } from '@app/shared/dto/user-id.dto';
import { UserByIdForAdminDto } from '@app/shared/dto/userById.dto';
import { MessagePatterns } from '@app/shared/general/message-patterns.constants';
import { Services } from '@app/shared/general/services.contants';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class UserService {
  constructor(
    @Inject(Services.USER) private readonly clientUserService: ClientProxy,
  ) {}

  async getAllUsers(userId: number) {
    const payload: UserIdDto = { userId };
    return this.clientUserService.send(
      { cmd: MessagePatterns.GET_ALL_USERS },
      payload,
    );
  }

  async getUserById(userId: number, selectUserId: number) {
    const payload: UserByIdForAdminDto = { userId, selectUserId };
    return this.clientUserService.send(
      { cmd: MessagePatterns.GET_USER_BY_ID },
      payload,
    );
  }

  async getUserByEmail(email: string) {
    const payload: UserEmailDto = { email };
    return this.clientUserService.send(
      { cmd: MessagePatterns.FIND_AUTH_USER },
      payload,
    );
  }

  async createUser(credentials: CreateUserDto) {
    return this.clientUserService.send(
      { cmd: MessagePatterns.CREATE_USER },
      credentials,
    );
  }
}
