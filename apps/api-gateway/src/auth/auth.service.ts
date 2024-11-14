import { AppLoggerService } from '@app/shared';
import { CreateUserDto } from '@app/shared/dto/create-user.dto';
import { User } from '@app/shared/interfaces/user.interface';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { comparePasswords } from 'apps/user/src/utils/helpers';
import { lastValueFrom } from 'rxjs';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly logger: AppLoggerService,
  ) {
    logger.setContext(AuthService.name);
  }

  async registerUser(credentials: CreateUserDto) {
    this.logger.log('Registering new user...');
    const res = await this.userService.createUser(credentials);
    this.logger.log('Successfully registered new user');
    return res;
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    this.logger.log('Validating user');
    const user = await lastValueFrom<User | null>(
      await this.userService.getUserByEmail(email),
    );
    if (!user) {
      this.logger.error('Tried to validate a non existing user');
      return null;
    }
    const { password: hashedPassword, ...userDetails } = user;
    const isPasswordValid = await comparePasswords(password, hashedPassword);
    if (!isPasswordValid) {
      this.logger.error(`User with id ${user.id} provided a wrong password`);
      return null;
    }
    this.logger.log('User is authenticated');
    return userDetails as User;
  }

  async login(user: User) {
    this.logger.log(`Logging in user: ${user.id}`);
    const payload = { sub: user.id, email: user.email };
    const accessToken = await this.jwtService.signAsync(payload);
    return { accessToken };
  }

  async getProfile(userId: number) {
    this.logger.log(`Getting profile for user ${userId}`);
    const userProfileResponse = await this.userService.getUserById(
      userId,
      userId,
    );
    this.logger.log('Successfully retrieved user profile');
    return userProfileResponse;
  }
}
