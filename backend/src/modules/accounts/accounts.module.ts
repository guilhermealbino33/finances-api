import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsController } from './controllers/accounts.controller';
import { AccountEntity } from './entities/account.entity';
import { AccountsService } from './services/accounts.service';

@Module({
  imports: [TypeOrmModule.forFeature([AccountEntity])],
  controllers: [AccountsController],
  providers: [AccountsService],
  exports: [AccountsService, TypeOrmModule],
})
export class AccountsModule {}
