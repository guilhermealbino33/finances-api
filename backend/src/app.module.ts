import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrosscuttingConfigModule } from './crosscutting/config';
import { AppDataSource } from './crosscutting/database/data-source';
import { AccountsModule } from './modules/accounts';
import { AuthModule } from './modules/auth';
import { HealthModule } from './modules/health';
import { PartiesModule } from './modules/parties';
import { PeriodsModule } from './modules/periods';
import { SeedModule } from './modules/seed/seed.module';
import { UsersModule } from './modules/users';

@Module({
  imports: [
    CrosscuttingConfigModule,
    TypeOrmModule.forRoot({
      ...AppDataSource.options,
      autoLoadEntities: true,
      migrationsRun: true,
      synchronize: false,
      retryAttempts: 10,
      retryDelay: 3000,
    }),
    UsersModule,
    AuthModule,
    PeriodsModule,
    AccountsModule,
    PartiesModule,
    SeedModule,
    HealthModule,
  ],
})
export class AppModule {}
