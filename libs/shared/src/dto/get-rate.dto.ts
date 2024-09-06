import { IntersectionType, PickType } from '@nestjs/mapped-types';
import { IsLowercase, IsString, MaxLength, MinLength } from 'class-validator';
import { BaseAssetDto } from './base-asset.dto';
import { UserIdDto } from './user-id.dto';

export class GetRateDto extends PickType(BaseAssetDto, ['id']) {
  @IsString()
  @IsLowercase()
  @MinLength(3)
  @MaxLength(4)
  currency: string;
}

export class GetRatePayloadDto extends IntersectionType(
  GetRateDto,
  UserIdDto,
) {}
