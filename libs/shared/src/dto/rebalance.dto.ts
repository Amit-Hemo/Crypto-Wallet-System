import { Optional } from '@nestjs/common';
import { IntersectionType } from '@nestjs/mapped-types';
import {
  IsLowercase,
  IsNotEmpty,
  IsObject,
  IsString,
  MaxLength,
  MinLength,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { UserIdDto } from './user-id.dto';

@ValidatorConstraint({ name: 'IsPercentageSumValid', async: false })
export class IsPercentageSumValid implements ValidatorConstraintInterface {
  validate(
    targetPercentages: Record<string, number>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _args: ValidationArguments,
  ) {
    const totalPercentage = Object.values(targetPercentages).reduce(
      (sum, percentage) => sum + percentage,
      0,
    );
    return totalPercentage === 100;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  defaultMessage(_args: ValidationArguments) {
    return 'The sum of the target percentages must be exactly 100%';
  }
}

@ValidatorConstraint({ async: false })
export class IsValidPercentagesConstraint
  implements ValidatorConstraintInterface
{
  validate(
    targetPercentages: Record<string, number>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _args: ValidationArguments,
  ) {
    return Object.values(targetPercentages).every(
      (percentage) =>
        typeof percentage === 'number' && percentage > 0 && percentage < 100,
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  defaultMessage(_args: ValidationArguments) {
    return 'Each target percentage should be a number between 0 and 100.';
  }
}

export class TargetPercentagesDto {
  @Validate(IsPercentageSumValid)
  @Validate(IsValidPercentagesConstraint)
  @IsNotEmpty()
  @IsObject()
  targetPercentages: Record<string, number>;
}

export class RebalancePayloadDto extends IntersectionType(
  TargetPercentagesDto,
  UserIdDto,
) {
  @IsString()
  @IsLowercase()
  @MinLength(3)
  @MaxLength(4)
  @Optional()
  currency: string = 'usd';
}
