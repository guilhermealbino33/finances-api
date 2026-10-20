import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { AccountsService } from '../accounts';
import { PartiesService } from '../parties';
import { UsersService } from '../users';

/** Seed local (#4/#6 / DOMAIN.md) — usuário + contas/partes da planilha. */
@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly accountsService: AccountsService,
    private readonly partiesService: PartiesService,
  ) {}

  async onModuleInit(): Promise<void> {
    const email = process.env.SEED_USER_EMAIL ?? 'guilhermealbino33@gmail.com';
    const password = process.env.SEED_USER_PASSWORD ?? 'finances123';
    const name = process.env.SEED_USER_NAME ?? 'Guilherme Albino';

    const user = await this.usersService.ensureSeedUser({ name, email, password });
    this.logger.log(`Seed user pronto: ${user.email} (id=${user.id})`);

    await this.accountsService.ensureSeedAccounts(user.id);
    await this.partiesService.ensureSeedParties(user.id);
    this.logger.log(`Seed contas/partes pronto para userId=${user.id}`);
  }
}
