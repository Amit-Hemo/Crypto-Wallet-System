import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { BaseAssetDto } from './base-asset.dto';

export class AddAssetDto extends BaseAssetDto {
  @IsNumber()
  @Min(0)
  amount: number;
}

export class AddAssetPayloadDto extends AddAssetDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}
