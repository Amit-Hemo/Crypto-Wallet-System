import { AppLoggerService } from '@app/shared';
import { generateRevokedTokenCacheKey } from '@app/shared/cache/cache-key.util';
import { TTlTimes } from '@app/shared/cache/ttl-times';
import { CreateUserDto } from '@app/shared/dto/create-user.dto';
import { JwtPayload } from '@app/shared/interfaces/auth.interface';
import { User } from '@app/shared/interfaces/user.interface';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { comparePasswords } from 'apps/user/src/utils/helpers';
import { lastValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly logger: AppLoggerService,
  ) {
    logger.setContext(AuthService.name);
  }

  async registerUser(credentials: CreateUserDto) {
    try {
      this.logger.log('Registering new user...');
      const res = await this.userService.createUser(credentials);
      this.logger.log('Successfully registered new user');
      return res;
    } catch (error) {
      this.logger.error(`Failed to register user ${error?.message ?? ''}`);
      throw error;
    }
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    try {
      this.logger.log('Validating user...');
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
    } catch (error) {
      this.logger.error(`Failed to validate user ${error?.message ?? ''}`);
      throw new InternalServerErrorException(
        'Failed to validate user, please try again later',
      );
    }
  }

  async login(user: User): Promise<string> {
    this.logger.log(`Logging in user: ${user.id}`);
    const payload = {
      sub: user.id,
      email: user.email,
      jti: uuidv4(),
    };
    try {
      const accessToken = await this.jwtService.signAsync(payload);
      this.logger.log(
        'Successfully logged in the user and granted access token',
      );
      return accessToken;
    } catch (error) {
      this.logger.error(`Failed to grant access token ${error?.message ?? ''}`);
      throw new InternalServerErrorException(
        'Failed to grant access token, please try again later',
      );
    }
  }

  async revokeToken(token: string): Promise<void> {
    try {
      this.logger.log('Revoking token to user');
      const { jti: tokenId } = this.jwtService.decode<JwtPayload>(token);
      const cacheKey = generateRevokedTokenCacheKey(tokenId);
      await this.cacheManager.set(cacheKey, true, TTlTimes.HALF_AN_HOUR);
      this.logger.log(
        'Successfully revoked token and was added to revoke list',
      );
    } catch (error) {
      this.logger.error(
        `Failed to add token to revoked token list ${error?.message ?? ''}`,
      );
      throw new InternalServerErrorException(
        'The system failed to logout due to server error, please try again later',
      );
    }
  }

  async isTokenRevoked(tokenId: string): Promise<boolean> {
    try {
      const cacheKey = generateRevokedTokenCacheKey(tokenId);
      const value = await this.cacheManager.get<string>(cacheKey);
      return Boolean(value);
    } catch (error) {
      this.logger.error(
        `Failed to check token revocation ${error?.message ?? ''}`,
      );
      //A fallback to regular token validation process, the token will be available until expiration
      return false;
    }
  }

  async getProfile(userId: number) {
    try {
      this.logger.log(`Getting profile for user ${userId}`);
      const userProfileResponse = await this.userService.getUserById(
        userId,
        userId,
      );
      this.logger.log('Successfully retrieved user profile');
      return userProfileResponse;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve user profile ${error?.message ?? ''}`,
      );
      throw new InternalServerErrorException(
        'Failed to retrieve user profile, please try again later',
      );
    }
  }
}
