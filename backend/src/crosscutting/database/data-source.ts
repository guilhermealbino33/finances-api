import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { entities } from './entities';
import { migrations } from './migrations';
import * as path from 'path';

const backendRoot = path.resolve(__dirname, '../../..');
const monorepoRoot = path.resolve(backendRoot, '..');

config({ path: path.join(backendRoot, '.env') });
config({ path: path.join(monorepoRoot, '.env') });
config({ path: path.resolve(process.cwd(), '.env') });
config({ path: path.resolve(process.cwd(), '../.env') });

const databaseUrl = process.env.DATABASE_URL;
const isUrlMode = !!databaseUrl;
const useSsl =
  process.env.DATABASE_SSL === 'true' ||
  (isUrlMode && !/localhost|127\.0\.0\.1/.test(databaseUrl || ''));

const baseOptions = {
  type: 'postgres' as const,
  entities,
  migrations,
  synchronize: false,
  logging: process.env.NODE_ENV !== 'production',
  migrationsRun: true,
};

export const AppDataSource = new DataSource(
  isUrlMode
    ? {
        ...baseOptions,
        url: databaseUrl!,
        ssl: useSsl ? { rejectUnauthorized: false } : false,
      }
    : {
        ...baseOptions,
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '5446', 10),
        username: process.env.DATABASE_USERNAME || 'finances',
        password: process.env.DATABASE_PASSWORD || 'finances',
        database: process.env.DATABASE_NAME || 'finances',
      },
);
