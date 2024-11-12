import { AppLoggerService } from '@app/shared';
import { CreateUserDto } from '@app/shared/dto/create-user.dto';
import { User } from '@app/shared/interfaces/user.interface';
import { mockRepository } from '@app/shared/mocks';
import { ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User as UserEntity } from './entities/User';
import { UserService } from './user.service';
import * as helpers from './utils/helpers';

describe('BalanceService', () => {
  let userRepository: Repository<UserEntity>;
  let userService: UserService;

  const USER_REPOSITORY_TOKEN = getRepositoryToken(UserEntity);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        ConfigService,
        {
          provide: USER_REPOSITORY_TOKEN,
          useValue: mockRepository,
        },
        {
          provide: AppLoggerService,
          useValue: {
            log: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            setContext: jest.fn(),
          },
        },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    userRepository = module.get(USER_REPOSITORY_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser, happy flows', () => {
    it('should create a new user with hashed password', async () => {
      const userCredentials: CreateUserDto = {
        email: 'blabla@gmail.com',
        password: 'mypassword123',
        username: 'blalalala',
      };
      const hashedPassword = 'ksdlhgfdsklfh353543o543@fgkjd12';
      const queryBuilder = userRepository.createQueryBuilder();

      jest
        .spyOn(userService as any, 'getUserByEmail')
        .mockResolvedValueOnce(null);
      jest.spyOn(helpers, 'hashPassword').mockResolvedValueOnce(hashedPassword);

      await userService.createUser(userCredentials);

      expect(userRepository.createQueryBuilder).toHaveBeenCalledWith('user');
      expect(queryBuilder.insert).toHaveBeenCalled();
      expect(queryBuilder.insert().values).toHaveBeenCalledWith({
        ...userCredentials,
        password: hashedPassword,
      });
      expect(queryBuilder.execute).toHaveBeenCalled();
    });
  });

  describe('createUser, sad flows', () => {
    it('should throw ConflictException if user already exists', async () => {
      const userCredentials: CreateUserDto = {
        email: 'blabla@gmail.com',
        password: 'mypassword123',
        username: 'blalalala',
      };

      jest
        .spyOn(userService as any, 'getUserByEmail')
        .mockResolvedValueOnce({ email: userCredentials.email });

      await expect(userService.createUser(userCredentials)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('gelAllUsers, happy flows', () => {
    it('should return all users', async () => {
      const mockUsers: User[] = [
        {
          id: 1,
          username: 'balala',
          email: 'masdif@fmasdkf.com',
        },
        {
          id: 2,
          username: 'balalas',
          email: 'maf@fmf.com',
        },
      ];

      const queryBuilder = userRepository.createQueryBuilder();
      jest
        .spyOn(queryBuilder, 'getMany')
        .mockResolvedValueOnce(mockUsers as UserEntity[]);

      const res = await userService.getAllUsers();
      expect(userRepository.createQueryBuilder).toHaveBeenCalledWith('user');
      expect(queryBuilder.select).toHaveBeenCalled();
      expect(queryBuilder.getMany).toHaveBeenCalled();
      expect(res).toStrictEqual<User[]>(mockUsers);
    });
  });

  describe('getUserByEmail', () => {
    it('should return user with email while excluding password', async () => {
      const email = 'blala@sd.com';
      const returnedUser = {
        id: 3,
        email,
        username: 'blalalala',
      };

      const queryBuilder = userRepository.createQueryBuilder();
      jest
        .spyOn(queryBuilder, 'getOne')
        .mockResolvedValueOnce(returnedUser as UserEntity);

      const res = await userService.getUserByEmail(email);
      expect(userRepository.createQueryBuilder).toHaveBeenCalledWith('user');
      expect(queryBuilder.select).toHaveBeenCalled();
      expect(queryBuilder.addSelect).not.toHaveBeenCalled();
      expect(queryBuilder.getOne).toHaveBeenCalled();
      expect(res).toStrictEqual(returnedUser);
      expect(res.email).toEqual(returnedUser.email);
    });

    it('should return user with email including password', async () => {
      const email = 'blala@sd.com';
      const returnedUser = {
        id: 3,
        email,
        username: 'blalalala',
        password: 'fdsfljsfsda34fd',
      };

      const queryBuilder = userRepository.createQueryBuilder();
      jest
        .spyOn(queryBuilder, 'getOne')
        .mockResolvedValueOnce(returnedUser as UserEntity);

      const res = await userService.getUserByEmail(email, {
        exposePassword: true,
      });
      expect(userRepository.createQueryBuilder).toHaveBeenCalledWith('user');
      expect(queryBuilder.addSelect).toHaveBeenCalledWith('user.password');
      expect(queryBuilder.getOne).toHaveBeenCalled();
      expect(res).toStrictEqual(returnedUser);
      expect(res.email).toEqual(returnedUser.email);
    });

    it('should return null if user not found', async () => {
      const email = 'blala@sd.com';

      const queryBuilder = userRepository.createQueryBuilder();
      jest.spyOn(queryBuilder, 'getOne').mockResolvedValueOnce(null);

      const res = await userService.getUserByEmail(email);
      expect(userRepository.createQueryBuilder).toHaveBeenCalledWith('user');
      expect(queryBuilder.select).toHaveBeenCalled();
      expect(queryBuilder.getOne).toHaveBeenCalled();
      expect(res).toStrictEqual(null);
    });
  });

  describe('getUserById', () => {
    it('should return user with the same id', async () => {
      const id = 2;
      const returnedUser = {
        id,
        email: 'faskdfnslf@csd.com',
        username: 'asfd',
      };

      const queryBuilder = userRepository.createQueryBuilder();
      jest
        .spyOn(queryBuilder, 'getOne')
        .mockResolvedValueOnce(returnedUser as UserEntity);

      const res = await userService.getUserById(id);
      expect(userRepository.createQueryBuilder).toHaveBeenCalledWith('user');
      expect(queryBuilder.select).toHaveBeenCalled();
      expect(queryBuilder.getOne).toHaveBeenCalled();
      expect(res).toStrictEqual(returnedUser);
      expect(res.id).toEqual(returnedUser.id);
    });

    it('should return null if user not found', async () => {
      const id = 2;
      const queryBuilder = userRepository.createQueryBuilder();
      jest.spyOn(queryBuilder, 'getOne').mockResolvedValueOnce(null);

      const res = await userService.getUserById(id);
      expect(userRepository.createQueryBuilder).toHaveBeenCalledWith('user');
      expect(queryBuilder.select).toHaveBeenCalled();
      expect(queryBuilder.getOne).toHaveBeenCalled();
      expect(res).toStrictEqual(null);
    });
  });
});
