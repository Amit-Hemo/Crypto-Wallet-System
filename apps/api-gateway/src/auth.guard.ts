import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const userId = this.extractUserFromHeader(request);
    if (!userId || isNaN(Number(userId))) {
      throw new UnauthorizedException('X-User-ID header is missing');
    }
    return true;
  }

  private extractUserFromHeader(request: Request): string | undefined {
    return request.headers['x-user-id'];
  }
}
