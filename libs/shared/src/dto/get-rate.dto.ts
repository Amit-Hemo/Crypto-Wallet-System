import { IntersectionType } from '@nestjs/mapped-types';
import {
  IsLowercase,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserIdDto } from './user-id.dto';

export class GetRateDto {
  @IsString()
  @IsNotEmpty()
  assetIds: string; //goal: comma separated ids (or one id)

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
