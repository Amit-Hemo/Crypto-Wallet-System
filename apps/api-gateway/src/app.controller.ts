import {
  AddAssetDto,
  AddAssetWithUserIDDto,
} from '@app/shared/dto/add-asset.dto';
import { isValidationError } from '@app/shared/utils/isValidationError';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  InternalServerErrorException,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';
import { catchError, throwError } from 'rxjs';
import { AuthGuard } from './auth.guard';

@UseGuards(AuthGuard)
@Controller()
export class AppController {
  private clientBalanceService: ClientProxy;
  private clientRateService: ClientProxy;
  constructor() {
    this.clientBalanceService = ClientProxyFactory.create({
      transport: Transport.TCP,
      options: {
        host: 'localhost',
        port: 3001,
      },
    });
    this.clientRateService = ClientProxyFactory.create({
      transport: Transport.TCP,
      options: {
        host: 'localhost',
        port: 3002,
      },
    });
  }

  @Get('/')
  getHello(): string {
    return 'hello';
  }

  @Put('/balances/assets')
  async addAssetToBalance(
    @Headers('X-User-ID') userId: string,
    @Body() assetDto: AddAssetDto,
  ) {
    const payload: AddAssetWithUserIDDto = { ...assetDto, userId };
    return this.clientBalanceService.send({ cmd: 'add_asset' }, payload).pipe(
      catchError((error) => {
        if (isValidationError(error)) {
          return throwError(() => new BadRequestException(error));
        }
        return throwError(() => new InternalServerErrorException(error));
      }),
    );
  }
}
