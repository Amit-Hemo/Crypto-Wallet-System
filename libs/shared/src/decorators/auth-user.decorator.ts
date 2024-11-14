import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { LoginAuthRequest } from '../interfaces/auth.interface';

/**
 * This decorator extracts user info added to a successful authenticated request
 */
export const AuthUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest() as LoginAuthRequest;
    return request.user;
  },
);
