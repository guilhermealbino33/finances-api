import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { UsersService } from '../users';

/** Seed local (#4 / DOMAIN.md) — usuário pessoal; lançamentos da planilha entram depois. */
@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly usersService: UsersService) {}

  async onModuleInit(): Promise<void> {
    const email = process.env.SEED_USER_EMAIL ?? 'guilhermealbino33@gmail.com';
    const password = process.env.SEED_USER_PASSWORD ?? 'finances123';
    const name = process.env.SEED_USER_NAME ?? 'Guilherme Albino';

    const user = await this.usersService.ensureSeedUser({ name, email, password });
    this.logger.log(`Seed user pronto: ${user.email} (id=${user.id})`);
  }
}
