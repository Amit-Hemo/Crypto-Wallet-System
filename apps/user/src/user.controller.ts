import { AppLoggerService } from '@app/shared';
import { SuccessResponse } from '@app/shared/api/responses';
import { CreateUserDto } from '@app/shared/dto/create-user.dto';
import { UserIdDto } from '@app/shared/dto/user-id.dto';
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

  @MessagePattern({ cmd: MessagePatterns.CREATE_USER })
  async createUser(@Payload() createUserCredentials: CreateUserDto) {
    this.logger.log(
      `Received request to create a new user for email: ${createUserCredentials.email}`,
    );
    try {
      await this.userService.createUser(createUserCredentials);
      const message = `Successfully created a new user for email: ${createUserCredentials.email}`;
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
