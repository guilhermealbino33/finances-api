import {
  Controller,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { ImportXlsxResponse } from '@finances/shared';
import { CurrentUser } from '../../../crosscutting/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../crosscutting/guards/jwt-auth.guard';
import type { JwtValidatedUser } from '../../auth/jwt.strategy';
import { ImportXlsxQueryDto } from '../dto/import-xlsx-query.dto';
import { ImportService } from '../services/import.service';

@Controller('import')
@UseGuards(JwtAuthGuard)
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  /**
   * POST /api/import/xlsx?commit=false|true
   * multipart field: `file` (.xlsx)
   */
  @Post('xlsx')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 15 * 1024 * 1024 },
    }),
  )
  importXlsx(
    @CurrentUser() user: JwtValidatedUser,
    @UploadedFile() file: Express.Multer.File,
    @Query() query: ImportXlsxQueryDto,
  ): Promise<ImportXlsxResponse> {
    return this.importService.importXlsx(user.id, file, query.commit === true);
  }
}
