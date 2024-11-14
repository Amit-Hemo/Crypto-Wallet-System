import { AppLoggerService } from '@app/shared';
import { CreateUserDto } from '@app/shared/dto/create-user.dto';
import {
  User,
  UserSelectionOptions,
} from '@app/shared/interfaces/user.interface';
import { ConflictException, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { instanceToPlain } from 'class-transformer';
import { Repository } from 'typeorm';
import { User as UserEntity } from './entities/User';
import { hashPassword } from './utils/helpers';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext(UserService.name);
  }

  async createUser(createUserCredentials: CreateUserDto): Promise<void> {
    try {
      const existingUser = await this.getUserByEmail(
        createUserCredentials.email,
      );

      if (existingUser) {
        this.logger.error(`User email already exists`);
        throw new ConflictException('User already exists');
      }

      const hashedPassword = await hashPassword(createUserCredentials.password);
      const params = { ...createUserCredentials, password: hashedPassword };
      await this.userRepository
        .createQueryBuilder('user')
        .insert()
        .values(params)
        .execute();

      this.logger.log('Successfully created new user');
    } catch (error) {
      this.logger.error(`Failed to create a new user: ${error?.message ?? ''}`);
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const allUsers = await this.userRepository
        .createQueryBuilder('user')
        .select(['user.id', 'user.username', 'user.email'])
        .getMany();
      this.logger.log('Successfully retrieved all users');
      return instanceToPlain(allUsers) as User[];
    } catch (error) {
      const message = `Failed to retrieve users: ${error?.message ?? ''}`;
      this.logger.error(message);
      throw new RpcException('Failed to retrieve users');
    }
  }

  async getUserById(id: number): Promise<User | null> {
    try {
      const user = await this.userRepository
        .createQueryBuilder('user')
        .select()
        .where('user.id = :id', { id })
        .getOne();

      this.logger.log('Successfully retrieved user');
      return instanceToPlain(user) as User;
    } catch (error) {
      const message = `Failed to retrieve user: ${error?.message ?? ''}`;
      this.logger.error(message);
      throw new RpcException('Successfully retrieved user if exists or null');
    }
  }

  async getUserByEmail(
    email: string,
    options?: UserSelectionOptions,
  ): Promise<User | null> {
    try {
      const query = this.userRepository
        .createQueryBuilder('user')
        .select()
        .where('user.email = :email', { email });
      if (options?.exposePassword) query.addSelect('user.password');

      const user = await query.getOne();
      this.logger.log('Successfully retrieved user if exists or null');
      return instanceToPlain(user) as User;
    } catch (error) {
      const message = `Failed to retrieve user: ${error?.message ?? ''}`;
      this.logger.error(message);
      throw new RpcException('Failed to retrieve user');
    }
  }
}
