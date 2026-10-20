import { IsBoolean, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ACCOUNT_TYPES, type AccountType } from '@finances/shared';

export class CreateAccountDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @IsIn(ACCOUNT_TYPES)
  type: AccountType;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
