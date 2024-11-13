import {
  IsEmail,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(3)
  @MaxLength(16)
  username: string;

  @IsStrongPassword()
  password: string;

  @IsEmail()
  email: string;
}
