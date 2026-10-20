import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { EntryResponse, EntrySection } from '@finances/shared';
import { AccountEntity } from '../../accounts/entities/account.entity';
import { PartyEntity } from '../../parties/entities/party.entity';
import { PeriodsService } from '../../periods/services/periods.service';
import { EntryEntity } from '../entities/entry.entity';
import { CreateEntryDto } from '../dto/create-entry.dto';
import { UpdateEntryDto } from '../dto/update-entry.dto';

const CARD_SECTIONS: EntrySection[] = ['CARD_ITEM', 'CARD_FIXED'];

@Injectable()
export class EntriesService {
  constructor(
    @InjectRepository(EntryEntity)
    private readonly repo: Repository<EntryEntity>,
    @InjectRepository(AccountEntity)
    private readonly accountsRepo: Repository<AccountEntity>,
    @InjectRepository(PartyEntity)
    private readonly partiesRepo: Repository<PartyEntity>,
    private readonly periodsService: PeriodsService,
  ) {}

  async list(
    userId: number,
    periodId: number,
    section?: EntrySection,
  ): Promise<EntryResponse[]> {
    await this.periodsService.getById(userId, periodId);
    const where =
      section != null ? { userId, periodId, section } : { userId, periodId };
    const rows = await this.repo.find({
      where,
      order: { sortOrder: 'ASC', id: 'ASC' },
    });
    return rows.map((row) => this.toResponse(row));
  }

  async findOne(userId: number, id: number): Promise<EntryResponse> {
    return this.toResponse(await this.getById(userId, id));
  }

  async create(userId: number, dto: CreateEntryDto): Promise<EntryResponse> {
    await this.periodsService.getById(userId, dto.periodId);
    await this.assertAccount(userId, dto.accountId);
    await this.assertParty(userId, dto.partyId);
    this.assertInstallments(dto.installmentCurrent, dto.installmentTotal);

    let accountId = dto.accountId ?? null;
    if (accountId == null && CARD_SECTIONS.includes(dto.section)) {
      accountId = await this.resolveDefaultCardAccountId(userId);
    }

    let sortOrder = dto.sortOrder ?? null;
    if (sortOrder == null) {
      const raw = await this.repo
        .createQueryBuilder('e')
        .select('MAX(e.sort_order)', 'max')
        .where('e.user_id = :userId AND e.period_id = :periodId AND e.section = :section', {
          userId,
          periodId: dto.periodId,
          section: dto.section,
        })
        .getRawOne<{ max: string | null }>();
      sortOrder = raw?.max != null ? Number(raw.max) + 1 : 0;
    }

    const row = this.repo.create({
      userId,
      periodId: dto.periodId,
      section: dto.section,
      description: dto.description.trim(),
      amount: dto.amount,
      dueLabel: this.nullableTrim(dto.dueLabel),
      installmentCurrent: dto.installmentCurrent ?? null,
      installmentTotal: dto.installmentTotal ?? null,
      accountId,
      partyId: dto.partyId ?? null,
      seriesId: null,
      notes: this.nullableTrim(dto.notes),
      sortOrder,
    });
    const saved = await this.repo.save(row);
    return this.toResponse(saved);
  }

  async update(userId: number, id: number, dto: UpdateEntryDto): Promise<EntryResponse> {
    const row = await this.getById(userId, id);

    if (dto.description !== undefined) row.description = dto.description.trim();
    if (dto.amount !== undefined) row.amount = dto.amount;
    if (dto.dueLabel !== undefined) row.dueLabel = this.nullableTrim(dto.dueLabel);
    if (dto.notes !== undefined) row.notes = this.nullableTrim(dto.notes);
    if (dto.sortOrder !== undefined) row.sortOrder = dto.sortOrder;

    if (dto.installmentCurrent !== undefined || dto.installmentTotal !== undefined) {
      const current =
        dto.installmentCurrent !== undefined
          ? dto.installmentCurrent
          : row.installmentCurrent;
      const total =
        dto.installmentTotal !== undefined ? dto.installmentTotal : row.installmentTotal;
      this.assertInstallments(current, total);
      if (dto.installmentCurrent !== undefined) row.installmentCurrent = dto.installmentCurrent;
      if (dto.installmentTotal !== undefined) row.installmentTotal = dto.installmentTotal;
    }

    if (dto.accountId !== undefined) {
      await this.assertAccount(userId, dto.accountId);
      row.accountId = dto.accountId;
    }
    if (dto.partyId !== undefined) {
      await this.assertParty(userId, dto.partyId);
      row.partyId = dto.partyId;
    }

    const saved = await this.repo.save(row);
    return this.toResponse(saved);
  }

  async remove(userId: number, id: number): Promise<void> {
    const row = await this.getById(userId, id);
    await this.repo.remove(row);
  }

  private async resolveDefaultCardAccountId(userId: number): Promise<number | null> {
    const preferred = await this.accountsRepo.findOne({
      where: { userId, name: 'Cartões', active: true },
    });
    if (preferred) return preferred.id;
    const anyCard = await this.accountsRepo.findOne({
      where: { userId, type: 'CARD', active: true },
      order: { id: 'ASC' },
    });
    return anyCard?.id ?? null;
  }

  private assertInstallments(
    current?: number | null,
    total?: number | null,
  ): void {
    if (current != null && total != null && current > total) {
      throw new BadRequestException('Parcela atual não pode ser maior que o total');
    }
    if ((current == null) !== (total == null)) {
      throw new BadRequestException('Informe parcela atual e total juntos, ou nenhum');
    }
  }

  private async getById(userId: number, id: number): Promise<EntryEntity> {
    const row = await this.repo.findOne({ where: { id, userId } });
    if (!row) throw new NotFoundException('Lançamento não encontrado');
    return row;
  }

  private async assertAccount(userId: number, accountId?: number | null): Promise<void> {
    if (accountId == null) return;
    const account = await this.accountsRepo.findOne({ where: { id: accountId, userId } });
    if (!account) throw new BadRequestException('Conta inválida para este usuário');
  }

  private async assertParty(userId: number, partyId?: number | null): Promise<void> {
    if (partyId == null) return;
    const party = await this.partiesRepo.findOne({ where: { id: partyId, userId } });
    if (!party) throw new BadRequestException('Parte inválida para este usuário');
  }

  private nullableTrim(value?: string | null): string | null {
    if (value == null) return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  private toResponse(row: EntryEntity): EntryResponse {
    return {
      id: row.id,
      periodId: row.periodId,
      section: row.section,
      description: row.description,
      amount: Number(row.amount),
      dueLabel: row.dueLabel,
      installmentCurrent: row.installmentCurrent,
      installmentTotal: row.installmentTotal,
      accountId: row.accountId,
      partyId: row.partyId,
      seriesId: row.seriesId,
      notes: row.notes,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
