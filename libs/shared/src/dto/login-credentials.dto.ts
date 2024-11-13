import { IsEmail, IsStrongPassword } from 'class-validator';

export class LoginCredentialsDto {
  @IsEmail()
  email: string;

  @IsStrongPassword()
  password: string;
}
