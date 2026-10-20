import { IsIn, IsOptional } from 'class-validator';
import { RECURRING_SERIES_STATUSES, type RecurringSeriesStatus } from '@finances/shared';

export class ListRecurringQueryDto {
  @IsOptional()
  @IsIn(RECURRING_SERIES_STATUSES)
  status?: RecurringSeriesStatus;
}
