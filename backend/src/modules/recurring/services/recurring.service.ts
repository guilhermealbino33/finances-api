import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  MaterializeSeriesResponse,
  RecurringSeriesResponse,
  RecurringSeriesStatus,
} from '@finances/shared';
import { AccountEntity } from '../../accounts/entities/account.entity';
import { EntryEntity } from '../../entries/entities/entry.entity';
import { PeriodsService } from '../../periods/services/periods.service';
import { RecurringSeriesEntity } from '../entities/recurring-series.entity';
import { CreateRecurringSeriesDto } from '../dto/create-recurring-series.dto';
import { UpdateRecurringSeriesDto } from '../dto/update-recurring-series.dto';

@Injectable()
export class RecurringService {
  constructor(
    @InjectRepository(RecurringSeriesEntity)
    private readonly repo: Repository<RecurringSeriesEntity>,
    @InjectRepository(EntryEntity)
    private readonly entriesRepo: Repository<EntryEntity>,
    @InjectRepository(AccountEntity)
    private readonly accountsRepo: Repository<AccountEntity>,
    private readonly periodsService: PeriodsService,
  ) {}

  async list(userId: number, status?: RecurringSeriesStatus): Promise<RecurringSeriesResponse[]> {
    const where = status ? { userId, status } : { userId };
    const rows = await this.repo.find({ where, order: { name: 'ASC' } });
    return rows.map((row) => this.toResponse(row));
  }

  async findOne(userId: number, id: number): Promise<RecurringSeriesResponse> {
    return this.toResponse(await this.getById(userId, id));
  }

  async create(userId: number, dto: CreateRecurringSeriesDto): Promise<RecurringSeriesResponse> {
    await this.assertAccount(userId, dto.accountId);
    this.assertInstallmentShape(dto.nextInstallment ?? 1, dto.totalInstallments ?? null);

    const row = this.repo.create({
      userId,
      name: dto.name.trim(),
      section: dto.section,
      accountId: dto.accountId ?? null,
      defaultAmount: dto.defaultAmount ?? null,
      totalInstallments: dto.totalInstallments ?? null,
      nextInstallment: dto.nextInstallment ?? 1,
      dueRule: this.nullableTrim(dto.dueRule),
      status: dto.status ?? 'ACTIVE',
    });
    return this.toResponse(await this.repo.save(row));
  }

  async update(
    userId: number,
    id: number,
    dto: UpdateRecurringSeriesDto,
  ): Promise<RecurringSeriesResponse> {
    const row = await this.getById(userId, id);

    if (dto.name !== undefined) row.name = dto.name.trim();
    if (dto.section !== undefined) row.section = dto.section;
    if (dto.accountId !== undefined) {
      await this.assertAccount(userId, dto.accountId);
      row.accountId = dto.accountId;
    }
    if (dto.defaultAmount !== undefined) row.defaultAmount = dto.defaultAmount;
    if (dto.totalInstallments !== undefined) row.totalInstallments = dto.totalInstallments;
    if (dto.nextInstallment !== undefined) row.nextInstallment = dto.nextInstallment;
    if (dto.dueRule !== undefined) row.dueRule = this.nullableTrim(dto.dueRule);
    if (dto.status !== undefined) row.status = dto.status;

    this.assertInstallmentShape(row.nextInstallment, row.totalInstallments);

    return this.toResponse(await this.repo.save(row));
  }

  /**
   * Materializa Entries das séries ACTIVE no período.
   * Idempotente por (periodId, seriesId). Avança nextInstallment; completa série se acabou.
   */
  async materializePeriod(userId: number, periodId: number): Promise<MaterializeSeriesResponse> {
    await this.periodsService.getById(userId, periodId);

    const seriesList = await this.repo.find({
      where: { userId, status: 'ACTIVE' },
      order: { id: 'ASC' },
    });

    let created = 0;
    let skipped = 0;
    let completed = 0;
    const entryIds: number[] = [];

    for (const series of seriesList) {
      if (series.defaultAmount == null || series.defaultAmount <= 0) {
        skipped += 1;
        continue;
      }
      if (
        series.totalInstallments != null &&
        series.nextInstallment > series.totalInstallments
      ) {
        series.status = 'COMPLETED';
        await this.repo.save(series);
        completed += 1;
        skipped += 1;
        continue;
      }

      const existing = await this.entriesRepo.findOne({
        where: { userId, periodId, seriesId: series.id },
      });
      if (existing) {
        skipped += 1;
        continue;
      }

      const current = series.nextInstallment;
      const total = series.totalInstallments;
      const dueLabel =
        series.dueRule?.trim() ||
        (total != null ? `${current}/${total}` : `Parcela ${current}`);

      const entry = this.entriesRepo.create({
        userId,
        periodId,
        section: series.section,
        description: series.name,
        amount: Number(series.defaultAmount),
        dueLabel,
        installmentCurrent: current,
        installmentTotal: total,
        accountId: series.accountId,
        partyId: null,
        seriesId: series.id,
        notes: null,
        sortOrder: null,
      });
      const saved = await this.entriesRepo.save(entry);
      entryIds.push(saved.id);
      created += 1;

      series.nextInstallment = current + 1;
      if (total != null && series.nextInstallment > total) {
        series.status = 'COMPLETED';
        completed += 1;
      }
      await this.repo.save(series);
    }

    return { periodId, created, skipped, completed, entryIds };
  }

  private async getById(userId: number, id: number): Promise<RecurringSeriesEntity> {
    const row = await this.repo.findOne({ where: { id, userId } });
    if (!row) throw new NotFoundException('Série não encontrada');
    return row;
  }

  private assertInstallmentShape(next: number, total: number | null): void {
    if (total != null && next > total + 1) {
      throw new BadRequestException('Próxima parcela inconsistente com o total');
    }
  }

  private async assertAccount(userId: number, accountId?: number | null): Promise<void> {
    if (accountId == null) return;
    const account = await this.accountsRepo.findOne({ where: { id: accountId, userId } });
    if (!account) throw new BadRequestException('Conta inválida para este usuário');
  }

  private nullableTrim(value?: string | null): string | null {
    if (value == null) return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  private toResponse(row: RecurringSeriesEntity): RecurringSeriesResponse {
    return {
      id: row.id,
      name: row.name,
      section: row.section,
      accountId: row.accountId,
      defaultAmount: row.defaultAmount == null ? null : Number(row.defaultAmount),
      totalInstallments: row.totalInstallments,
      nextInstallment: row.nextInstallment,
      dueRule: row.dueRule,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
