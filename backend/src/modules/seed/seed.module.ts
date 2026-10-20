import { Module } from '@nestjs/common';
import { AccountsModule } from '../accounts';
import { PartiesModule } from '../parties';
import { UsersModule } from '../users';
import { SeedService } from './seed.service';

@Module({
  imports: [UsersModule, AccountsModule, PartiesModule],
  providers: [SeedService],
})
export class SeedModule {}
