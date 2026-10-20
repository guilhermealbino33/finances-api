import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountEntity } from '../accounts/entities/account.entity';
import { EntryEntity } from '../entries/entities/entry.entity';
import { PeriodsModule } from '../periods';
import { RecurringController } from './controllers/recurring.controller';
import { RecurringSeriesEntity } from './entities/recurring-series.entity';
import { RecurringService } from './services/recurring.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([RecurringSeriesEntity, EntryEntity, AccountEntity]),
    PeriodsModule,
  ],
  controllers: [RecurringController],
  providers: [RecurringService],
  exports: [RecurringService, TypeOrmModule],
})
export class RecurringModule {}
