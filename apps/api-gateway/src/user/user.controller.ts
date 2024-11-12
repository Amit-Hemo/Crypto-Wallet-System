import { CreateUserDto } from '@app/shared/dto/create-user.dto';
import { Routes } from '@app/shared/general/routes.constants';
import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth.guard';
import { UserService } from './user.service';

@ApiTags('user')
@UseGuards(AuthGuard)
@Controller(Routes.USERS)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getAllUsers(@Headers('X-User-ID') userId: number) {
    return this.userService.getAllUsers(Number(userId));
  }

  @Get(':selectUserId')
  async getUserById(
    @Headers('X-User-ID') userId: number,
    @Param('selectUserId', ParseIntPipe) selectUserId: number,
  ) {
    return this.userService.getUserById(Number(userId), selectUserId);
  }

  @Post()
  async createUser(
    @Headers('X-User-ID') userId: number,
    @Body() credentials: CreateUserDto,
  ) {
    return this.userService.createUser(credentials);
  }
}
