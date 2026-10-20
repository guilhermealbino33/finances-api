import { registerAs, ConfigType } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL,
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5446', 10),
  username: process.env.DATABASE_USERNAME || 'finances',
  password: process.env.DATABASE_PASSWORD || 'finances',
  name: process.env.DATABASE_NAME || 'finances',
  ssl: process.env.DATABASE_SSL === 'true',
}));

export type DatabaseConfig = ConfigType<typeof databaseConfig>;
