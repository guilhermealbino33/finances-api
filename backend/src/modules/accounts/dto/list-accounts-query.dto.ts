import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class ListAccountsQueryDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  active?: boolean;
}
