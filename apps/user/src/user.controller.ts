import { AppLoggerService } from '@app/shared';
import { MessagePatterns } from '@app/shared/general/message-patterns.constants';
import { User } from '@app/shared/interfaces/user.interface';
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
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
  getAllUsers(): User[] {
    return this.userService.getAllUsers();
  }

  // @Get('/:id')
  // getUserById(@Param('id', ParseIntPipe) id: number): User {
  //   return this.userService.getUserById(id);
  // }
}
