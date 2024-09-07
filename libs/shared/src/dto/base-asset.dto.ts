import { IsNotEmpty, IsString } from 'class-validator';

export class BaseAssetDto {
  @IsString()
  @IsNotEmpty()
  id: string;
}
