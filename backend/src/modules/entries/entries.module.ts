import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountEntity } from '../accounts/entities/account.entity';
import { PartyEntity } from '../parties/entities/party.entity';
import { PeriodsModule } from '../periods';
import { EntriesController } from './controllers/entries.controller';
import { EntryEntity } from './entities/entry.entity';
import { EntriesService } from './services/entries.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([EntryEntity, AccountEntity, PartyEntity]),
    PeriodsModule,
  ],
  controllers: [EntriesController],
  providers: [EntriesService],
  exports: [EntriesService, TypeOrmModule],
})
export class EntriesModule {}
