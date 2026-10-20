import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { PeriodResponse, PeriodSummaryResponse } from '@finances/shared';
import { PeriodEntity } from '../entities/period.entity';
import { CreatePeriodDto } from '../dto/create-period.dto';
import { UpdatePeriodDto } from '../dto/update-period.dto';

@Injectable()
export class PeriodsService {
  constructor(
    @InjectRepository(PeriodEntity)
    private readonly repo: Repository<PeriodEntity>,
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

  /** Stub até #7/#8 — só Caixa entra no saldo; demais totais zerados. */
  async summary(userId: number, id: number): Promise<PeriodSummaryResponse> {
    const period = this.toResponse(await this.getById(userId, id));
    const totalPayables = 0;
    const totalReceivables = 0;
    const totalCard = 0;
    const totalCashOut = 0;
    const totalOtherIncome = 0;
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
