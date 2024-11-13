import { Request } from 'express';
import { User } from './user.interface';

export interface UserLoginDetails {
  email: string;
  password: string;
}

export interface AuthenticatedRequest extends Request {
  user: User;
}
