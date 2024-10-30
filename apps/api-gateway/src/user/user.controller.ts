import { MessagePatterns } from '@app/shared/general/message-patterns.constants';
import { Routes } from '@app/shared/general/routes.constants';
import { Services } from '@app/shared/general/services.contants';
import { Controller, Get, Headers, Inject, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth.guard';

@ApiTags('user')
@UseGuards(AuthGuard)
@Controller(Routes.USERS)
export class UserController {
  constructor(
    @Inject(Services.USER) private readonly clientUserService: ClientProxy,
  ) {}

  @Get()
  async getAllUsers(@Headers('X-User-ID') userId: string) {
    return this.clientUserService.send(
      { cmd: MessagePatterns.GET_ALL_USERS },
      {},
    );
  }
}
