import { AppLoggerService } from '@app/shared';
import { LoginCredentialsDto } from '@app/shared/dto/login-credentials.dto';
import {
  BadRequestException,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { NextFunction, Request, Response } from 'express';
import { AuthController } from '../auth.controller';

/**
 * A solution to validate the request body DTO before Guard takes place
 */
@Injectable()
export class LoginValidationMiddleware implements NestMiddleware {
  constructor(private readonly logger: AppLoggerService) {
    logger.setContext(AuthController.name);
  }

  async use(req: Request, _res: Response, next: NextFunction) {
    this.logger.log('Validation Middleware: validating login credentials');
    const credentials = plainToInstance(LoginCredentialsDto, req.body);
    const validationErrors = await validate(credentials);
    if (validationErrors.length > 0) {
      throw new BadRequestException(validationErrors);
    }
    this.logger.log('Validation Middleware: Successfully validated');
    next();
  }
}
