import { IsLowercase, IsString, MaxLength, MinLength } from 'class-validator';
import { UserIdDto } from './user-id.dto';

export class BalanceValueDto extends UserIdDto {
  @IsString()
  @IsLowercase()
  @MinLength(3)
  @MaxLength(4)
  currency: string;
}
