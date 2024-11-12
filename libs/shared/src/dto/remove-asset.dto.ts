import { IntersectionType, PickType } from '@nestjs/mapped-types';
import { IsNumber, Min } from 'class-validator';
import { BaseAssetDto } from './base-asset.dto';
import { UserIdDto } from './user-id.dto';

export class RemoveAssetDto {
  @IsNumber()
  @Min(0)
  amount: number;
}

export class RemoveAssetPayloadDto extends IntersectionType(
  PickType(BaseAssetDto, ['searchId'] as const),
  RemoveAssetDto,
  UserIdDto,
) {}
