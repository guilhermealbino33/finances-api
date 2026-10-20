import { Module } from '@nestjs/common';
import { UsersModule } from '../users';
import { SeedService } from './seed.service';

@Module({
  imports: [UsersModule],
  providers: [SeedService],
})
export class SeedModule {}
