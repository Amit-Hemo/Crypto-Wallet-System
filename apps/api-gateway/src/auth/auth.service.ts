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
    const res = await this.userService.createUser(credentials);
    this.logger.log('Successfully registered new user');
    return res;
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    this.logger.log('Validating user');
    const { password: hashedPassword, ...user } =
      await lastValueFrom<User | null>(
        await this.userService.getUserByEmail(email),
      );
    if (!user) {
      this.logger.error('Tried to validate a non existing user');
      return null;
    }
    const isPasswordValid = await comparePasswords(password, hashedPassword);
    if (!isPasswordValid) {
      this.logger.error(`User with id ${user.id} provided a wrong password`);
      return null;
    }
    this.logger.log('User is authenticated');
    return user as User;
  }

  async login(user: User) {
    const payload = { sub: user.id, email: user.email };
    const accessToken = await this.jwtService.signAsync(payload);
    return { accessToken };
  }
}
