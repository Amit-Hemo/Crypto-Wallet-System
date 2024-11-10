import { CreateUserDto } from '@app/shared/dto/create-user.dto';
import { Routes } from '@app/shared/general/routes.constants';
import {
  Body,
  Controller,
  Get,
  Headers,
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

  @Post()
  async createUser(
    @Headers('X-User-ID') userId: number,
    @Body() credentials: CreateUserDto,
  ) {
    return this.userService.createUser(credentials);
  }
}
