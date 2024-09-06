import { AddAssetDto, AddAssetPayloadDto } from '@app/shared/dto/add-asset.dto';
import {
  RemoveAssetDto,
  RemoveAssetPayloadDto,
} from '@app/shared/dto/remove-asset.dto';
import { UserIdDto } from '@app/shared/dto/user-id.dto';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Patch,
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

  @Get('/balances/assets')
  async getBalance(@Headers('X-User-ID') userId: string) {
    const payload: UserIdDto = { userId };
    return this.clientBalanceService.send({ cmd: 'get_balance' }, payload).pipe(
      catchError((error) => {
        if (
          error instanceof BadRequestException ||
          error instanceof NotFoundException
        ) {
          return throwError(() => error);
        }
        return throwError(() => new InternalServerErrorException(error));
      }),
    );
  }

  @Put('/balances/assets')
  async addAssetToBalance(
    @Headers('X-User-ID') userId: string,
    @Body() assetDto: AddAssetDto,
  ) {
    const payload: AddAssetPayloadDto = { ...assetDto, userId };
    return this.clientBalanceService.send({ cmd: 'add_asset' }, payload).pipe(
      catchError((error) => {
        if (error instanceof BadRequestException) {
          return throwError(() => error);
        }
        return throwError(() => new InternalServerErrorException(error));
      }),
    );
  }

  @Patch('/balances/assets/:id')
  async removeAssetFromBalance(
    @Headers('X-User-ID') userId: string,
    @Param('id') assetId: string,
    @Body() body: RemoveAssetDto,
  ) {
    const payload: RemoveAssetPayloadDto = { ...body, id: assetId, userId };
    return this.clientBalanceService
      .send({ cmd: 'remove_asset' }, payload)
      .pipe(
        catchError((error) => {
          if (
            error instanceof BadRequestException ||
            error instanceof BadRequestException
          ) {
            return throwError(() => error);
          }
          return throwError(() => new InternalServerErrorException(error));
        }),
      );
  }
}
