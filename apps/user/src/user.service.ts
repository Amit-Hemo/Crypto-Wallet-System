import { AppLoggerService } from '@app/shared';
import { CreateUserDto } from '@app/shared/dto/create-user.dto';
import { User } from '@app/shared/interfaces/user.interface';
import { ConflictException, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
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
        this.logger.error(`User ${createUserCredentials.email} already exists`);
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
      return allUsers;
    } catch (error) {
      const message = `Failed to retrieve users: ${error?.message ?? ''}`;
      this.logger.error(message);
      throw new RpcException('Failed to retrieve users');
    }
  }

  async getUserByEmail(email: string): Promise<Pick<UserEntity, 'id'> | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .select('user.id')
      .where('user.email = :email', { email })
      .getOne();
  }
}
