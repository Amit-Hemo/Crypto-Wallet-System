import { CreateUserDto } from '@app/shared/dto/create-user.dto';
import { UserIdDto } from '@app/shared/dto/user-id.dto';
import { MessagePatterns } from '@app/shared/general/message-patterns.constants';
import { Routes } from '@app/shared/general/routes.constants';
import { Services } from '@app/shared/general/services.contants';
import {
  Body,
  Controller,
  Get,
  Headers,
  Inject,
  Post,
  UseGuards,
} from '@nestjs/common';
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
  async getAllUsers(@Headers('X-User-ID') userId: number) {
    const payload: UserIdDto = { userId: Number(userId) };
    return this.clientUserService.send(
      { cmd: MessagePatterns.GET_ALL_USERS },
      payload,
    );
  }

  @Post()
  async createUser(
    @Headers('X-User-ID') userId: number,
    @Body() credentials: CreateUserDto,
  ) {
    return this.clientUserService.send(
      { cmd: MessagePatterns.CREATE_USER },
      credentials,
    );
  }
}
