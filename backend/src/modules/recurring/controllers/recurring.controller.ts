import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { MaterializeSeriesResponse, RecurringSeriesResponse } from '@finances/shared';
import { CurrentUser } from '../../../crosscutting/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../crosscutting/guards/jwt-auth.guard';
import type { JwtValidatedUser } from '../../auth/jwt.strategy';
import { CreateRecurringSeriesDto } from '../dto/create-recurring-series.dto';
import { ListRecurringQueryDto } from '../dto/list-recurring-query.dto';
import { UpdateRecurringSeriesDto } from '../dto/update-recurring-series.dto';
import { RecurringService } from '../services/recurring.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class RecurringController {
  constructor(private readonly recurringService: RecurringService) {}

  @Get('recurring-series')
  list(
    @CurrentUser() user: JwtValidatedUser,
    @Query() query: ListRecurringQueryDto,
  ): Promise<RecurringSeriesResponse[]> {
    return this.recurringService.list(user.id, query.status);
  }

  @Get('recurring-series/:id')
  getOne(
    @CurrentUser() user: JwtValidatedUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<RecurringSeriesResponse> {
    return this.recurringService.findOne(user.id, id);
  }

  @Post('recurring-series')
  create(
    @CurrentUser() user: JwtValidatedUser,
    @Body() body: CreateRecurringSeriesDto,
  ): Promise<RecurringSeriesResponse> {
    return this.recurringService.create(user.id, body);
  }

  @Patch('recurring-series/:id')
  update(
    @CurrentUser() user: JwtValidatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateRecurringSeriesDto,
  ): Promise<RecurringSeriesResponse> {
    return this.recurringService.update(user.id, id, body);
  }

  @Post('periods/:periodId/materialize-series')
  materialize(
    @CurrentUser() user: JwtValidatedUser,
    @Param('periodId', ParseIntPipe) periodId: number,
  ): Promise<MaterializeSeriesResponse> {
    return this.recurringService.materializePeriod(user.id, periodId);
  }
}
