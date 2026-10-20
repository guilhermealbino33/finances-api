import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePartyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
