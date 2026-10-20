import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { PartyResponse } from '@finances/shared';
import { PartyEntity } from '../entities/party.entity';
import { CreatePartyDto } from '../dto/create-party.dto';
import { UpdatePartyDto } from '../dto/update-party.dto';

/** Pessoas usadas em A receber na planilha 2026. */
const SEED_PARTIES: ReadonlyArray<string> = ['Gui', 'Udo', 'Vivi', 'Danilo'];

@Injectable()
export class PartiesService {
  constructor(
    @InjectRepository(PartyEntity)
    private readonly repo: Repository<PartyEntity>,
  ) {}

  async list(userId: number, active?: boolean): Promise<PartyResponse[]> {
    const where = active === undefined ? { userId } : { userId, active };
    const rows = await this.repo.find({
      where,
      order: { name: 'ASC' },
    });
    return rows.map((row) => this.toResponse(row));
  }

  async getById(userId: number, id: number): Promise<PartyEntity> {
    const row = await this.repo.findOne({ where: { id, userId } });
    if (!row) throw new NotFoundException('Parte não encontrada');
    return row;
  }

  async findOne(userId: number, id: number): Promise<PartyResponse> {
    return this.toResponse(await this.getById(userId, id));
  }

  async create(userId: number, dto: CreatePartyDto): Promise<PartyResponse> {
    const name = dto.name.trim();
    const existing = await this.repo.findOne({ where: { userId, name } });
    if (existing) {
      throw new ConflictException('Já existe uma parte com este nome');
    }

    const row = this.repo.create({
      userId,
      name,
      active: dto.active ?? true,
    });
    const saved = await this.repo.save(row);
    return this.toResponse(saved);
  }

  async update(userId: number, id: number, dto: UpdatePartyDto): Promise<PartyResponse> {
    const row = await this.getById(userId, id);

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (name !== row.name) {
        const clash = await this.repo.findOne({ where: { userId, name } });
        if (clash) throw new ConflictException('Já existe uma parte com este nome');
      }
      row.name = name;
    }
    if (dto.active !== undefined) row.active = dto.active;

    const saved = await this.repo.save(row);
    return this.toResponse(saved);
  }

  /** Idempotente — cria partes padrão da planilha se faltarem. */
  async ensureSeedParties(userId: number): Promise<void> {
    for (const name of SEED_PARTIES) {
      const existing = await this.repo.findOne({ where: { userId, name } });
      if (existing) continue;
      await this.repo.save(
        this.repo.create({
          userId,
          name,
          active: true,
        }),
      );
    }
  }

  private toResponse(row: PartyEntity): PartyResponse {
    return {
      id: row.id,
      name: row.name,
      active: row.active,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
