import { registerAs, ConfigType } from '@nestjs/config';

function parseCorsOrigin(value: string | undefined): string | string[] | true {
  const trimmed = value?.trim();
  if (!trimmed) return true;
  if (trimmed.includes(',')) return trimmed.split(',').map((o) => o.trim());
  return trimmed;
}

export const serverConfig = registerAs('server', () => ({
  port: parseInt(process.env.PORT ?? '3002', 10),
  env: process.env.NODE_ENV ?? 'development',
  corsOrigin: parseCorsOrigin(process.env.CORS_ORIGIN),
}));

export type ServerConfig = ConfigType<typeof serverConfig>;
