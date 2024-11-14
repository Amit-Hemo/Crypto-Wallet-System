import { AppLoggerService } from '@app/shared';
import { AuthUser } from '@app/shared/decorators/auth-user.decorator';
import { CreateUserDto } from '@app/shared/dto/create-user.dto';
import { LoginCredentialsDto } from '@app/shared/dto/login-credentials.dto';
import { Routes } from '@app/shared/general/routes.constants';
import { AuthenticatedUser } from '@app/shared/interfaces/auth.interface';
import { User } from '@app/shared/interfaces/user.interface';
import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';

@UsePipes(
  new ValidationPipe({
    forbidUnknownValues: true,
    exceptionFactory: (errors) => new BadRequestException(errors),
  }),
)
@ApiTags('auth')
@Controller(Routes.AUTH)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: AppLoggerService,
  ) {
    logger.setContext(AuthController.name);
  }

  /**
   * Registers a new user
   * @param credentails Create user credentials
   */
  @Post('register')
  async registerUser(@Body() credentails: CreateUserDto) {
    this.logger.log('Received request to register user');
    try {
      const res = await this.authService.registerUser(credentails);
      this.logger.log('Successfull result, new user has been registered');
      return res;
    } catch (error) {
      this.logger.error(`Error processing request: ${error.message}`);
      throw error;
    }
  }

  /**
   * Logs in a user
   * @param user Authenticated user after providing valid credentials
   * @returns Access Token
   */
  @UseGuards(LocalAuthGuard)
  @ApiBody({ type: LoginCredentialsDto, description: 'Login credentials' })
  @Post('login')
  async login(@AuthUser() user: User) {
    return this.authService.login(user);
  }

  /**
   * Gets user profile
   * @param user Authenticated user after providing valid credentials
   * @returns User profile
   */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('profile')
  async getProfile(@AuthUser() user: AuthenticatedUser) {
    return this.authService.getProfile(user.id);
  }
}
