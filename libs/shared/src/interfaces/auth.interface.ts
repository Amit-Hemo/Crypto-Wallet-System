import { Request } from 'express';
import { JwtAuthUser, User } from './user.interface';

export interface UserLoginDetails {
  email: string;
  password: string;
}

export type AuthenticatedUser = User | JwtAuthUser;

export interface LoginAuthRequest extends Request {
  user: AuthenticatedUser;
}

export interface JwtPayload {
  sub: number;
  email: string;
  jti: string;
  iat: number;
  exp: number;
}
