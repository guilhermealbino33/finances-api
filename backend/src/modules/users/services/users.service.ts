import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
  ) {}

  async findById(id: number): Promise<UserEntity> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async findByEmail(email: string, withPassword = false): Promise<UserEntity | null> {
    const qb = this.repo
      .createQueryBuilder('user')
      .where('LOWER(user.email) = LOWER(:email)', { email: email.trim() });

    if (withPassword) {
      qb.addSelect('user.passwordHash');
    }

    return qb.getOne();
  }

  async ensureSeedUser(input: {
    name: string;
    email: string;
    password: string;
  }): Promise<UserEntity> {
    const existing = await this.findByEmail(input.email);
    if (existing) return existing;

    const user = this.repo.create({
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      passwordHash: input.password,
      status: 'ATIVO',
      lastLoginAt: null,
    });

    return this.repo.save(user);
  }

  async touchLastLogin(id: number): Promise<void> {
    await this.repo.update(id, { lastLoginAt: new Date() });
  }
}
