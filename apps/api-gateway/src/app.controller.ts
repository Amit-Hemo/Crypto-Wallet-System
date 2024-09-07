import { AddAssetDto, AddAssetPayloadDto } from '@app/shared/dto/add-asset.dto';
import { GetRateDto, GetRatePayloadDto } from '@app/shared/dto/get-rate.dto';
import {
  RemoveAssetDto,
  RemoveAssetPayloadDto,
} from '@app/shared/dto/remove-asset.dto';
import { UserIdDto } from '@app/shared/dto/user-id.dto';
import { serviceNames } from '@app/shared/general/service-names';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Inject,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Patch,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, throwError } from 'rxjs';
import { AuthGuard } from './auth.guard';

@UseGuards(AuthGuard)
@Controller()
export class AppController {
  @Inject(serviceNames.BALANCE) private clientBalanceService: ClientProxy;
  @Inject(serviceNames.RATE) private clientRateService: ClientProxy;
  constructor() {}

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
            error instanceof NotFoundException
          ) {
            return throwError(() => error);
          }
          return throwError(() => new InternalServerErrorException(error));
        }),
      );
  }

  @Get('/rates')
  async getCryptoRate(
    @Headers('X-User-ID') userId: string,
    @Query() exchangeDetails: GetRateDto,
  ) {
    const payload: GetRatePayloadDto = { userId, ...exchangeDetails };
    return this.clientRateService.send({ cmd: 'get_rate' }, payload).pipe(
      catchError((error) => {
        if (error instanceof BadRequestException) {
          return throwError(() => error);
        }
        return throwError(() => new InternalServerErrorException(error));
      }),
    );
  }
}
