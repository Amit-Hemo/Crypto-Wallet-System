import { AppLoggerService } from '@app/shared';
import { SuccessResponse } from '@app/shared/api/responses';
import { CreateUserDto } from '@app/shared/dto/create-user.dto';
import { UserEmailDto } from '@app/shared/dto/user-email.dto';
import { UserIdDto } from '@app/shared/dto/user-id.dto';
import { UserByIdForAdminDto } from '@app/shared/dto/userById.dto';
import { MessagePatterns } from '@app/shared/general/message-patterns.constants';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext(UserController.name);
  }

  @MessagePattern({ cmd: MessagePatterns.GET_ALL_USERS })
  async getAllUsers(@Payload() { userId }: UserIdDto) {
    this.logger.log(`Received request to retrieve all users`);
    try {
      const allUsers = await this.userService.getAllUsers();
      const message = `Successfully retrieved all users for ${userId}`;
      this.logger.log(message);
      return new SuccessResponse(message, allUsers);
    } catch (error) {
      this.logger.error(
        `Error processing request for user ${userId}: ${error?.message ?? ''}`,
      );
      if (error instanceof RpcException) throw error;
      throw new RpcException(error);
    }
  }

  @MessagePattern({ cmd: MessagePatterns.GET_USER_BY_ID })
  async getUserById(@Payload() { userId, selectUserId }: UserByIdForAdminDto) {
    this.logger.log(`Received request to retrieve user for user: ${userId}`);
    try {
      const user = await this.userService.getUserById(selectUserId);
      const message = `Successfully retrieved the user(if exists) ${selectUserId}`;
      this.logger.log(message);
      return new SuccessResponse(message, user);
    } catch (error) {
      this.logger.error(`Error processing request: ${error?.message ?? ''}`);
      if (error instanceof RpcException) throw error;
      throw new RpcException(error);
    }
  }

  @MessagePattern({ cmd: MessagePatterns.FIND_AUTH_USER })
  async findAuthUser(@Payload() { email }: UserEmailDto) {
    this.logger.log(`Received request to check on user by email`);
    try {
      const user = await this.userService.getUserByEmail(email, {
        exposePassword: true,
      });
      const message = `Successfully found and retreieved the user if exists`;
      this.logger.log(message);
      return user;
    } catch (error) {
      this.logger.error(`Error processing request: ${error?.message ?? ''}`);
      if (error instanceof RpcException) throw error;
      throw new RpcException(error);
    }
  }

  @MessagePattern({ cmd: MessagePatterns.CREATE_USER })
  async createUser(@Payload() createUserCredentials: CreateUserDto) {
    this.logger.log('Received request to create a new user');
    try {
      await this.userService.createUser(createUserCredentials);
      const message = 'Successfully created a new user';
      this.logger.log(message);
      return new SuccessResponse(message);
    } catch (error) {
      this.logger.error(
        `Error processing a createUser request: ${error?.message ?? ''}`,
      );
      if (error instanceof RpcException) throw error;
      throw new RpcException(error);
    }
  }
}
