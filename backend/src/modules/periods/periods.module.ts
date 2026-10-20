import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PeriodsController } from './controllers/periods.controller';
import { PeriodEntity } from './entities/period.entity';
import { PeriodsService } from './services/periods.service';

@Module({
  imports: [TypeOrmModule.forFeature([PeriodEntity])],
  controllers: [PeriodsController],
  providers: [PeriodsService],
  exports: [PeriodsService, TypeOrmModule],
})
export class PeriodsModule {}
