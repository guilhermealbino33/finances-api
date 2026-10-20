import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { databaseConfig, serverConfig } from './namespaces';
import { validate } from './env.validation';
import * as path from 'path';

const backendRoot = path.resolve(__dirname, '../../..');
const monorepoRoot = path.resolve(backendRoot, '..');

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      validate,
      isGlobal: true,
      envFilePath: [
        path.join(backendRoot, '.env'),
        path.join(monorepoRoot, '.env'),
        path.resolve(process.cwd(), '.env'),
        path.resolve(process.cwd(), '../.env'),
      ],
      ignoreEnvFile: process.env.NODE_ENV === 'production',
      load: [databaseConfig, serverConfig],
    }),
  ],
  exports: [ConfigModule],
})
export class CrosscuttingConfigModule {}
