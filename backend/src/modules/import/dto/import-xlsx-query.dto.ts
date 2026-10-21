import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class ImportXlsxQueryDto {
  /**
   * `false` (default) = dry-run / preview.
   * `true` = persiste (replace por mês).
   */
  @IsOptional()
  @Transform(({ value }) => {
    if (value === true || value === 'true' || value === '1') return true;
    if (value === false || value === 'false' || value === '0') return false;
    return false;
  })
  @IsBoolean()
  commit?: boolean;
}
