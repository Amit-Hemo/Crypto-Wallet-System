import {
  ArgumentsHost,
  Catch,
  HttpException,
  InternalServerErrorException,
  RpcExceptionFilter,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { throwError } from 'rxjs';

@Catch(RpcException)
export class GlobalRpcExceptionFilter
  implements RpcExceptionFilter<RpcException>
{
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  catch(exception: RpcException, _host: ArgumentsHost) {
    const error = exception.getError();
    const message = 'Internal server error';
    if (error instanceof HttpException) {
      return throwError(() => error.getResponse());
    }
    if (typeof error === 'object' && 'statusCode' in error) {
      return throwError(() => error);
    }
    return throwError(() =>
      new InternalServerErrorException(message).getResponse(),
    );
  }
}
