import { IsNotEmpty, IsNumber } from 'class-validator';
import { UserIdDto } from './user-id.dto';

export class UserByIdForAdminDto extends UserIdDto {
  @IsNumber()
  @IsNotEmpty()
  selectUserId: number;
}
