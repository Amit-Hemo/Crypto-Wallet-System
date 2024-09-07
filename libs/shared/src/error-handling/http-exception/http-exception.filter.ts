import { ErrorResponse } from '@app/shared/api/responses';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();
    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR.valueOf();
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      message = exception.message;
    } else if (exception instanceof Error) {
      message = exception.message;
    } else if (
      typeof exception === 'object' &&
      'statusCode' in exception &&
      'message' in exception
    ) {
      httpStatus = Number(exception.statusCode);
      message = exception.message as string;
    }

    const errorResponse = new ErrorResponse(
      httpStatus,
      message,
      httpAdapter.getRequestUrl(ctx.getRequest()),
    );

    httpAdapter.reply(ctx.getResponse(), errorResponse, httpStatus);
  }
}
