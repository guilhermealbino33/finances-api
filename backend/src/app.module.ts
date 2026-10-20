import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrosscuttingConfigModule } from './crosscutting/config';
import { AppDataSource } from './crosscutting/database/data-source';
import { HealthModule } from './modules/health';

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
    HealthModule,
  ],
})
export class AppModule {}
