import { IsIn, IsOptional } from 'class-validator';
import { ENTRY_SECTIONS, type EntrySection } from '@finances/shared';

export class ListEntriesQueryDto {
  @IsOptional()
  @IsIn(ENTRY_SECTIONS)
  section?: EntrySection;
}
