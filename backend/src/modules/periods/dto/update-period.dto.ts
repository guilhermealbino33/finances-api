import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdatePeriodDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  caixaBudget?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string | null;
}
