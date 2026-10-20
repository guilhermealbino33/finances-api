import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import {
  EDITABLE_ENTRY_SECTIONS,
  RECURRING_SERIES_STATUSES,
  type EditableEntrySection,
  type RecurringSeriesStatus,
} from '@finances/shared';

export class CreateRecurringSeriesDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @IsIn(EDITABLE_ENTRY_SECTIONS)
  section: EditableEntrySection;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  accountId?: number | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  defaultAmount?: number | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  totalInstallments?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  nextInstallment?: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  dueRule?: string | null;

  @IsOptional()
  @IsIn(RECURRING_SERIES_STATUSES)
  status?: RecurringSeriesStatus;
}
