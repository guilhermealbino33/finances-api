import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import type { AccountType, ImportXlsxResponse } from '@finances/shared';
import { AccountEntity } from '../../accounts/entities/account.entity';
import { EntryEntity } from '../../entries/entities/entry.entity';
import { PartyEntity } from '../../parties/entities/party.entity';
import { PeriodEntity } from '../../periods/entities/period.entity';
import {
  parseWorkbookBuffer,
  type ParsedImportPeriod,
} from '../utils/xlsx-workbook.parser';

const ACCOUNT_TYPE_HINT: Record<string, AccountType> = {
  Cartões: 'CARD',
  Cartoes: 'CARD',
  C6: 'CARD',
  Dinheiro: 'CASH',
  BB: 'BANK',
};

@Injectable()
export class ImportService {
  constructor(private readonly dataSource: DataSource) {}

  async importXlsx(
    userId: number,
    file: Express.Multer.File | undefined,
    commit: boolean,
  ): Promise<ImportXlsxResponse> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Envie um arquivo .xlsx no campo "file"');
    }
    const name = (file.originalname ?? '').toLowerCase();
    if (name && !name.endsWith('.xlsx') && !name.endsWith('.xlsm')) {
      throw new BadRequestException('Arquivo deve ser .xlsx');
    }

    let parsed;
    try {
      parsed = parseWorkbookBuffer(file.buffer);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'erro desconhecido';
      throw new BadRequestException(`Falha ao ler planilha: ${message}`);
    }

    if (parsed.periods.length === 0) {
      throw new BadRequestException('Nenhuma aba mensal reconhecida na planilha');
    }

    if (!commit) {
      return {
        mode: 'preview',
        strategy: 'replace',
        periods: parsed.periods.map((p) => this.toPreview(p)),
        totals: parsed.totals,
      };
    }

    return this.commitParsed(userId, parsed.periods, parsed.totals);
  }

  private async commitParsed(
    userId: number,
    periods: ParsedImportPeriod[],
    totals: ImportXlsxResponse['totals'],
  ): Promise<ImportXlsxResponse> {
    const accountCache = new Map<string, number>();
    const partyCache = new Map<string, number>();

    const results = await this.dataSource.transaction(async (manager) => {
      const periodsRepo = manager.getRepository(PeriodEntity);
      const entriesRepo = manager.getRepository(EntryEntity);
      const accountsRepo = manager.getRepository(AccountEntity);
      const partiesRepo = manager.getRepository(PartyEntity);

      const out: ImportXlsxResponse['periods'] = [];

      for (const period of periods) {
        let row = await periodsRepo.findOne({
          where: { userId, year: period.year, month: period.month },
        });

        if (!row) {
          row = await periodsRepo.save(
            periodsRepo.create({
              userId,
              year: period.year,
              month: period.month,
              caixaBudget: period.caixaBudget,
              notes: null,
            }),
          );
        } else {
          row.caixaBudget = period.caixaBudget;
          row = await periodsRepo.save(row);
        }

        const existing = await entriesRepo.find({
          where: { userId, periodId: row.id },
          select: ['id'],
        });
        const replacedEntries = existing.length;
        if (replacedEntries > 0) {
          await entriesRepo.delete({ userId, periodId: row.id });
        }

        const entities: EntryEntity[] = [];
        for (const entry of period.entries) {
          let accountId: number | null = null;
          if (entry.accountName) {
            accountId = await this.ensureAccountId(
              userId,
              entry.accountName,
              accountCache,
              accountsRepo,
            );
          }

          let partyId: number | null = null;
          if (entry.partyName) {
            partyId = await this.ensurePartyId(
              userId,
              entry.partyName,
              partyCache,
              partiesRepo,
            );
          }

          entities.push(
            entriesRepo.create({
              userId,
              periodId: row.id,
              section: entry.section,
              description: entry.description,
              amount: entry.amount,
              dueLabel: entry.dueLabel,
              installmentCurrent: entry.installmentCurrent,
              installmentTotal: entry.installmentTotal,
              accountId,
              partyId,
              seriesId: null,
              notes: null,
              sortOrder: entry.sortOrder,
            }),
          );
        }

        if (entities.length > 0) {
          await entriesRepo.save(entities);
        }

        out.push({
          ...this.toPreview(period),
          periodId: row.id,
          replacedEntries,
        });
      }

      return out;
    });

    return {
      mode: 'commit',
      strategy: 'replace',
      periods: results,
      totals,
    };
  }

  private toPreview(period: ParsedImportPeriod): ImportXlsxResponse['periods'][number] {
    return {
      year: period.year,
      month: period.month,
      sheetName: period.sheetName,
      caixaBudget: period.caixaBudget,
      entryCount: period.entries.length,
      countsBySection: { ...period.countsBySection },
      warnings: [...period.warnings],
    };
  }

  private async ensureAccountId(
    userId: number,
    name: string,
    cache: Map<string, number>,
    repo: Repository<AccountEntity>,
  ): Promise<number> {
    const key = name.trim();
    const cached = cache.get(key);
    if (cached != null) return cached;

    let row = await repo.findOne({ where: { userId, name: key } });
    if (!row) {
      const type = ACCOUNT_TYPE_HINT[key] ?? 'OTHER';
      row = await repo.save(
        repo.create({
          userId,
          name: key,
          type,
          active: true,
        }),
      );
    }
    cache.set(key, row.id);
    return row.id;
  }

  private async ensurePartyId(
    userId: number,
    name: string,
    cache: Map<string, number>,
    repo: Repository<PartyEntity>,
  ): Promise<number> {
    const key = name.trim();
    const cached = cache.get(key);
    if (cached != null) return cached;

    let row = await repo.findOne({ where: { userId, name: key } });
    if (!row) {
      row = await repo.save(
        repo.create({
          userId,
          name: key,
          active: true,
        }),
      );
    }
    cache.set(key, row.id);
    return row.id;
  }
}
