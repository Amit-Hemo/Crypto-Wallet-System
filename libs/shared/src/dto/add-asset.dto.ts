import { IntersectionType } from '@nestjs/mapped-types';
import { IsNumber, Min } from 'class-validator';
import { BaseAssetDto } from './base-asset.dto';
import { UserIdDto } from './user-id.dto';

export class AddAssetDto extends BaseAssetDto {
  @IsNumber()
  @Min(0)
  amount: number;
}

export class AddAssetPayloadDto extends IntersectionType(
  AddAssetDto,
  UserIdDto,
) {}
