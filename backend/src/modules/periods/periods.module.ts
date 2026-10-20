import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntryEntity } from '../entries/entities/entry.entity';
import { PeriodsController } from './controllers/periods.controller';
import { PeriodEntity } from './entities/period.entity';
import { PeriodsService } from './services/periods.service';

@Module({
  imports: [TypeOrmModule.forFeature([PeriodEntity, EntryEntity])],
  controllers: [PeriodsController],
  providers: [PeriodsService],
  exports: [PeriodsService, TypeOrmModule],
})
export class PeriodsModule {}
