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
import type { PeriodResponse, PeriodSummaryResponse } from '@finances/shared';
import { CurrentUser } from '../../../crosscutting/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../crosscutting/guards/jwt-auth.guard';
import type { JwtValidatedUser } from '../../auth/jwt.strategy';
import { CreatePeriodDto } from '../dto/create-period.dto';
import { ListPeriodsQueryDto } from '../dto/list-periods-query.dto';
import { UpdatePeriodDto } from '../dto/update-period.dto';
import { PeriodsService } from '../services/periods.service';

@Controller('periods')
@UseGuards(JwtAuthGuard)
export class PeriodsController {
  constructor(private readonly periodsService: PeriodsService) {}

  @Get()
  list(
    @CurrentUser() user: JwtValidatedUser,
    @Query() query: ListPeriodsQueryDto,
  ): Promise<PeriodResponse[]> {
    return this.periodsService.list(user.id, query.year);
  }

  /** Rotas literais/numéricas antes de `:year/:month` — evita capturar `/periods/:id/entries`. */
  @Get(':id/summary')
  summary(
    @CurrentUser() user: JwtValidatedUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PeriodSummaryResponse> {
    return this.periodsService.summary(user.id, id);
  }

  @Get(':year(\\d+)/:month(\\d+)')
  getByYearMonth(
    @CurrentUser() user: JwtValidatedUser,
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
  ): Promise<PeriodResponse> {
    return this.periodsService.getByYearMonth(user.id, year, month);
  }

  @Post()
  create(
    @CurrentUser() user: JwtValidatedUser,
    @Body() body: CreatePeriodDto,
  ): Promise<PeriodResponse> {
    return this.periodsService.create(user.id, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtValidatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdatePeriodDto,
  ): Promise<PeriodResponse> {
    return this.periodsService.update(user.id, id, body);
  }
}
