import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { AccountResponse, AccountType } from '@finances/shared';
import { AccountEntity } from '../entities/account.entity';
import { CreateAccountDto } from '../dto/create-account.dto';
import { UpdateAccountDto } from '../dto/update-account.dto';

const SEED_ACCOUNTS: ReadonlyArray<{ name: string; type: AccountType }> = [
  { name: 'Cartões', type: 'CARD' },
  { name: 'C6', type: 'CARD' },
  { name: 'Dinheiro', type: 'CASH' },
  { name: 'BB', type: 'BANK' },
];

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(AccountEntity)
    private readonly repo: Repository<AccountEntity>,
  ) {}

  async list(userId: number, active?: boolean): Promise<AccountResponse[]> {
    const where = active === undefined ? { userId } : { userId, active };
    const rows = await this.repo.find({
      where,
      order: { name: 'ASC' },
    });
    return rows.map((row) => this.toResponse(row));
  }

  async getById(userId: number, id: number): Promise<AccountEntity> {
    const row = await this.repo.findOne({ where: { id, userId } });
    if (!row) throw new NotFoundException('Conta não encontrada');
    return row;
  }

  async findOne(userId: number, id: number): Promise<AccountResponse> {
    return this.toResponse(await this.getById(userId, id));
  }

  async create(userId: number, dto: CreateAccountDto): Promise<AccountResponse> {
    const name = dto.name.trim();
    const existing = await this.repo.findOne({ where: { userId, name } });
    if (existing) {
      throw new ConflictException('Já existe uma conta com este nome');
    }

    const row = this.repo.create({
      userId,
      name,
      type: dto.type,
      active: dto.active ?? true,
    });
    const saved = await this.repo.save(row);
    return this.toResponse(saved);
  }

  async update(userId: number, id: number, dto: UpdateAccountDto): Promise<AccountResponse> {
    const row = await this.getById(userId, id);

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (name !== row.name) {
        const clash = await this.repo.findOne({ where: { userId, name } });
        if (clash) throw new ConflictException('Já existe uma conta com este nome');
      }
      row.name = name;
    }
    if (dto.type !== undefined) row.type = dto.type;
    if (dto.active !== undefined) row.active = dto.active;

    const saved = await this.repo.save(row);
    return this.toResponse(saved);
  }

  /** Idempotente — cria contas padrão da planilha se faltarem. */
  async ensureSeedAccounts(userId: number): Promise<void> {
    for (const item of SEED_ACCOUNTS) {
      const existing = await this.repo.findOne({
        where: { userId, name: item.name },
      });
      if (existing) continue;
      await this.repo.save(
        this.repo.create({
          userId,
          name: item.name,
          type: item.type,
          active: true,
        }),
      );
    }
  }

  private toResponse(row: AccountEntity): AccountResponse {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      active: row.active,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
