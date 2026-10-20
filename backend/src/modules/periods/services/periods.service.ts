import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { EntrySection, PeriodResponse, PeriodSummaryResponse } from '@finances/shared';
import { EntryEntity } from '../../entries/entities/entry.entity';
import { PeriodEntity } from '../entities/period.entity';
import { CreatePeriodDto } from '../dto/create-period.dto';
import { UpdatePeriodDto } from '../dto/update-period.dto';

type SectionTotals = Record<EntrySection, number>;

@Injectable()
export class PeriodsService {
  constructor(
    @InjectRepository(PeriodEntity)
    private readonly repo: Repository<PeriodEntity>,
    @InjectRepository(EntryEntity)
    private readonly entriesRepo: Repository<EntryEntity>,
  ) {}

  async list(userId: number, year?: number): Promise<PeriodResponse[]> {
    const where = year != null ? { userId, year } : { userId };
    const rows = await this.repo.find({
      where,
      order: { year: 'DESC', month: 'DESC' },
    });
    return rows.map((row) => this.toResponse(row));
  }

  async getByYearMonth(userId: number, year: number, month: number): Promise<PeriodResponse> {
    const row = await this.repo.findOne({ where: { userId, year, month } });
    if (!row) throw new NotFoundException('Período não encontrado');
    return this.toResponse(row);
  }

  async getById(userId: number, id: number): Promise<PeriodEntity> {
    const row = await this.repo.findOne({ where: { id, userId } });
    if (!row) throw new NotFoundException('Período não encontrado');
    return row;
  }

  async create(userId: number, dto: CreatePeriodDto): Promise<PeriodResponse> {
    const existing = await this.repo.findOne({
      where: { userId, year: dto.year, month: dto.month },
    });
    if (existing) {
      throw new ConflictException('Já existe um período para este mês');
    }

    const row = this.repo.create({
      userId,
      year: dto.year,
      month: dto.month,
      caixaBudget: dto.caixaBudget,
      notes: dto.notes?.trim() ? dto.notes.trim() : null,
    });
    const saved = await this.repo.save(row);
    return this.toResponse(saved);
  }

  async update(userId: number, id: number, dto: UpdatePeriodDto): Promise<PeriodResponse> {
    const row = await this.getById(userId, id);
    if (dto.caixaBudget !== undefined) row.caixaBudget = dto.caixaBudget;
    if (dto.notes !== undefined) {
      row.notes = dto.notes?.trim() ? dto.notes.trim() : null;
    }
    const saved = await this.repo.save(row);
    return this.toResponse(saved);
  }

  /** Totais derivados (DOMAIN.md). totalCard entra na #8. */
  async summary(userId: number, id: number): Promise<PeriodSummaryResponse> {
    const period = this.toResponse(await this.getById(userId, id));
    const totals = await this.sumEntriesBySection(userId, id);

    const totalCard = totals.CARD_ITEM + totals.CARD_FIXED;
    const totalPayables = totals.PAYABLE + totalCard;
    const totalReceivables = totals.RECEIVABLE;
    const totalCashOut = totals.CASH_OUT;
    const totalOtherIncome = totals.OTHER_INCOME;
    const monthBalance = period.caixaBudget - totalPayables + totalReceivables;
    const detailBalance = monthBalance - totalCashOut + totalOtherIncome;

    return {
      period,
      totalPayables,
      totalReceivables,
      totalCard,
      totalCashOut,
      totalOtherIncome,
      monthBalance,
      detailBalance,
    };
  }

  private async sumEntriesBySection(userId: number, periodId: number): Promise<SectionTotals> {
    const empty: SectionTotals = {
      PAYABLE: 0,
      RECEIVABLE: 0,
      CARD_ITEM: 0,
      CARD_FIXED: 0,
      CASH_OUT: 0,
      OTHER_INCOME: 0,
    };

    const rows = await this.entriesRepo
      .createQueryBuilder('e')
      .select('e.section', 'section')
      .addSelect('COALESCE(SUM(e.amount), 0)', 'total')
      .where('e.user_id = :userId AND e.period_id = :periodId', { userId, periodId })
      .groupBy('e.section')
      .getRawMany<{ section: EntrySection; total: string }>();

    for (const row of rows) {
      if (row.section in empty) {
        empty[row.section] = Number(row.total);
      }
    }
    return empty;
  }

  private toResponse(row: PeriodEntity): PeriodResponse {
    return {
      id: row.id,
      year: row.year,
      month: row.month,
      caixaBudget: Number(row.caixaBudget),
      notes: row.notes,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
