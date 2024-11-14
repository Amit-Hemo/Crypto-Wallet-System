import { AuthUser } from '@app/shared/decorators/auth-user.decorator';
import { CreateUserDto } from '@app/shared/dto/create-user.dto';
import { Routes } from '@app/shared/general/routes.constants';
import { AuthenticatedUser } from '@app/shared/interfaces/auth.interface';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserService } from './user.service';

@ApiTags('user')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller(Routes.USERS)
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Gets all users
   */
  @Get()
  async getAllUsers(@AuthUser() user: AuthenticatedUser) {
    return this.userService.getAllUsers(user.id);
  }

  /**
   * Get a user by id
   * @param selectUserId The id of the user we want to get
   */
  @Get(':selectUserId')
  async getUserById(
    @AuthUser() user: AuthenticatedUser,
    @Param('selectUserId', ParseIntPipe) selectUserId: number,
  ) {
    return this.userService.getUserById(user.id, selectUserId);
  }

  /**
   * Creates a new user
   * @param credentials User details for the created user
   */
  @Post()
  async createUser(@Body() credentials: CreateUserDto) {
    return this.userService.createUser(credentials);
  }
}
