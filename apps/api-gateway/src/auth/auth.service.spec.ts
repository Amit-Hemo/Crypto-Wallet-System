import { AppLoggerService } from '@app/shared';
import { SuccessResponse } from '@app/shared/api/responses';
import * as cacheUtils from '@app/shared/cache/cache-key.util';
import { TTlTimes } from '@app/shared/cache/ttl-times';
import { JwtPayload } from '@app/shared/interfaces/auth.interface';
import { User } from '@app/shared/interfaces/user.interface';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import * as uuid from 'uuid';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';
import * as utils from './utils/helpers';

describe('AssetService', () => {
  let authService: AuthService;
  let jwtService: JwtService;
  let cacheManager: Cache;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        ConfigService,
        {
          provide: AppLoggerService,
          useValue: {
            log: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            setContext: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            decode: jest.fn(),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: {
            createUser: jest.fn(),
            getUserByEmail: jest.fn(),
            getUserById: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
    userService = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser, happy flows', () => {
    it('should return the user if password is correct', async () => {
      const credentials = {
        email: 'blala@gmail.com',
        password: 'rawPassword',
      };
      const returnedUser = {
        id: 1,
        email: credentials.email,
        username: 'balala',
        password: 'aslkgd43535@dsdmhgfsshhfjklasfsfklj',
      };

      jest
        .spyOn(userService, 'getUserByEmail')
        .mockReturnValueOnce(of(returnedUser) as any);
      jest.spyOn(utils, 'comparePasswords').mockResolvedValueOnce(true);

      const res = await authService.validateUser(
        credentials.email,
        credentials.password,
      );
      expect(userService.getUserByEmail).toHaveBeenCalledWith(
        credentials.email,
      );
      expect(utils.comparePasswords).toHaveBeenCalledWith(
        credentials.password,
        returnedUser.password,
      );
      expect(res).toStrictEqual<User>({
        id: returnedUser.id,
        email: returnedUser.email,
        username: returnedUser.username,
      });
      expect(res.email).toEqual(returnedUser.email);
    });
  });
  describe('validateUser, sad flows', () => {
    it('should return null if user is not exist', async () => {
      const credentials = {
        email: 'blala@gmail.com',
        password: 'rawPassword',
      };

      jest
        .spyOn(userService, 'getUserByEmail')
        .mockReturnValueOnce(of(null) as any);

      const res = await authService.validateUser(
        credentials.email,
        credentials.password,
      );
      expect(userService.getUserByEmail).toHaveBeenCalledWith(
        credentials.email,
      );
      expect(res).toStrictEqual<User>(null);
    });

    it('should return null if passwords are not matched', async () => {
      const credentials = {
        email: 'blala@gmail.com',
        password: 'rawPassword',
      };
      const returnedUser = {
        id: 1,
        email: credentials.email,
        username: 'balala',
        password: 'aslkgd43535@dsdmhgfsshhfjklasfsfklj',
      };

      jest
        .spyOn(userService, 'getUserByEmail')
        .mockReturnValueOnce(of(returnedUser) as any);
      jest.spyOn(utils, 'comparePasswords').mockResolvedValueOnce(false);

      const res = await authService.validateUser(
        credentials.email,
        credentials.password,
      );
      expect(userService.getUserByEmail).toHaveBeenCalledWith(
        credentials.email,
      );
      expect(utils.comparePasswords).toHaveBeenCalledWith(
        credentials.password,
        returnedUser.password,
      );
      expect(res).toStrictEqual<User>(null);
    });
  });

  describe('login', () => {
    it('should return access token', async () => {
      const user: User = {
        id: 1,
        email: 'balala@gmail.com',
        username: 'blala',
        password: 'fdsghfdsjgkl23534khl@fgsfdgsd',
      };
      const tokenId = 'adasgfdj234324fkdsljf';
      const payload = {
        sub: user.id,
        email: user.email,
        jti: tokenId,
      };
      const token = 'fasdgjsdggdfgjdflkfdgj34234lsdafsfsdjgs';

      jest.spyOn(uuid, 'v4').mockReturnValueOnce(tokenId as any);
      jest.spyOn(jwtService, 'signAsync').mockResolvedValueOnce(token);

      const res = await authService.login(user);
      expect(jwtService.signAsync).toHaveBeenCalledWith(payload);
      expect(res).toBe<string>(token);
    });
  });

  describe('revokeToken', () => {
    it('should add token to revoke tokens list in cache', async () => {
      const token = 'token';
      const tokenId = 'sdkghfdglds';
      const payload: JwtPayload = {
        email: 'blala@gmail.com',
        sub: 1,
        jti: tokenId,
        exp: 234323,
        iat: 3534535,
      };
      const cacheKey = 'dasdsds';

      jest.spyOn(jwtService, 'decode').mockReturnValueOnce(payload);
      jest
        .spyOn(cacheUtils, 'generateRevokedTokenCacheKey')
        .mockReturnValueOnce(cacheKey);

      await authService.revokeToken(token);
      expect(jwtService.decode).toHaveBeenCalledWith(token);
      expect(cacheUtils.generateRevokedTokenCacheKey).toHaveBeenCalledWith(
        tokenId,
      );
      expect(cacheManager.set).toHaveBeenCalledWith(
        cacheKey,
        true,
        TTlTimes.HALF_AN_HOUR,
      );
    });
  });

  describe('isTokenRevoked', () => {
    it('should return true', async () => {
      const cacheKey = 'asdfdss';
      const tokenId = 'id';

      jest
        .spyOn(cacheUtils, 'generateRevokedTokenCacheKey')
        .mockReturnValueOnce(cacheKey);
      jest.spyOn(cacheManager, 'get').mockResolvedValueOnce('true');

      const res = await authService.isTokenRevoked(tokenId);
      expect(cacheUtils.generateRevokedTokenCacheKey).toHaveBeenCalledWith(
        tokenId,
      );
      expect(cacheManager.get).toHaveBeenCalledWith(cacheKey);
      expect(res).toBe(true);
    });

    it('should return false', async () => {
      const cacheKey = 'asdfdss';
      const tokenId = 'id';

      jest
        .spyOn(cacheUtils, 'generateRevokedTokenCacheKey')
        .mockReturnValueOnce(cacheKey);
      jest.spyOn(cacheManager, 'get').mockResolvedValueOnce(undefined);

      const res = await authService.isTokenRevoked(tokenId);
      expect(cacheUtils.generateRevokedTokenCacheKey).toHaveBeenCalledWith(
        tokenId,
      );
      expect(cacheManager.get).toHaveBeenCalledWith(cacheKey);
      expect(res).toBe(false);
    });
  });

  describe('getProfile, happy flows', () => {
    it('should retun user details', async () => {
      const userId = 1;
      const user: User = {
        id: userId,
        email: 'blala@fm.com',
        username: 'balal',
      };

      jest
        .spyOn(userService, 'getUserById')
        .mockReturnValueOnce(of(new SuccessResponse('success', user)) as any);

      const res = await authService.getProfile(userId);
      expect(userService.getUserById).toHaveBeenCalledWith(userId, userId);
      expect(res).toStrictEqual<User>(user);
      expect(res.id).toBe(user.id);
    });
  });

  describe('getProfile, sad flows', () => {
    it('should throw InternalServerErrorException if user is not exist', async () => {
      const userId = 1;

      jest
        .spyOn(userService, 'getUserById')
        .mockReturnValueOnce(of(null) as any);

      await expect(authService.getProfile(userId)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(userService.getUserById).toHaveBeenCalledWith(userId, userId);
    });
  });
});
