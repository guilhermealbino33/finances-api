import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PartiesController } from './controllers/parties.controller';
import { PartyEntity } from './entities/party.entity';
import { PartiesService } from './services/parties.service';

@Module({
  imports: [TypeOrmModule.forFeature([PartyEntity])],
  controllers: [PartiesController],
  providers: [PartiesService],
  exports: [PartiesService, TypeOrmModule],
})
export class PartiesModule {}
