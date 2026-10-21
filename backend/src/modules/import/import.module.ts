import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountEntity } from '../accounts/entities/account.entity';
import { EntryEntity } from '../entries/entities/entry.entity';
import { PartyEntity } from '../parties/entities/party.entity';
import { PeriodEntity } from '../periods/entities/period.entity';
import { ImportController } from './controllers/import.controller';
import { ImportService } from './services/import.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PeriodEntity,
      EntryEntity,
      AccountEntity,
      PartyEntity,
    ]),
  ],
  controllers: [ImportController],
  providers: [ImportService],
  exports: [ImportService],
})
export class ImportModule {}
