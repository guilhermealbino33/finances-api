import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { EntryResponse } from '@finances/shared';
import { CurrentUser } from '../../../crosscutting/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../crosscutting/guards/jwt-auth.guard';
import type { JwtValidatedUser } from '../../auth/jwt.strategy';
import { CreateEntryDto } from '../dto/create-entry.dto';
import { ListEntriesQueryDto } from '../dto/list-entries-query.dto';
import { UpdateEntryDto } from '../dto/update-entry.dto';
import { EntriesService } from '../services/entries.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class EntriesController {
  constructor(private readonly entriesService: EntriesService) {}

  @Get('periods/:periodId/entries')
  listByPeriod(
    @CurrentUser() user: JwtValidatedUser,
    @Param('periodId', ParseIntPipe) periodId: number,
    @Query() query: ListEntriesQueryDto,
  ): Promise<EntryResponse[]> {
    return this.entriesService.list(user.id, periodId, query.section);
  }

  @Get('entries/:id')
  getOne(
    @CurrentUser() user: JwtValidatedUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<EntryResponse> {
    return this.entriesService.findOne(user.id, id);
  }

  @Post('entries')
  create(
    @CurrentUser() user: JwtValidatedUser,
    @Body() body: CreateEntryDto,
  ): Promise<EntryResponse> {
    return this.entriesService.create(user.id, body);
  }

  @Patch('entries/:id')
  update(
    @CurrentUser() user: JwtValidatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateEntryDto,
  ): Promise<EntryResponse> {
    return this.entriesService.update(user.id, id, body);
  }

  @Delete('entries/:id')
  @HttpCode(204)
  async remove(
    @CurrentUser() user: JwtValidatedUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.entriesService.remove(user.id, id);
  }
}
