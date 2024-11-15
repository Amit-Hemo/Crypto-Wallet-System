import type { AuthenticatedUser } from '@app/shared/interfaces/auth.interface';
import { JwtPayload } from '@app/shared/interfaces/auth.interface';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (!payload.jti) {
      throw new UnauthorizedException('Invalid token format');
    }
    const isRevoked = await this.authService.isTokenRevoked(payload.jti);
    if (isRevoked) {
      throw new UnauthorizedException(
        'Token has been revoked, please login to gain new token',
      );
    }
    return { id: payload.sub, email: payload.email };
  }
}
