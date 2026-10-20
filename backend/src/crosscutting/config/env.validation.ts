import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, validateSync } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Staging = 'staging',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @IsOptional()
  PORT: number = 3002;

  @IsString()
  @IsOptional()
  CORS_ORIGIN: string;

  @IsString()
  @IsOptional()
  DATABASE_URL: string;

  @IsString()
  @IsOptional()
  DATABASE_HOST: string;

  @IsNumber()
  @IsOptional()
  DATABASE_PORT: number;

  @IsString()
  @IsOptional()
  DATABASE_USERNAME: string;

  @IsString()
  @IsOptional()
  DATABASE_PASSWORD: string;

  @IsString()
  @IsOptional()
  DATABASE_NAME: string;

  @IsString()
  @IsOptional()
  DATABASE_SSL: string;

  @IsString()
  @IsOptional()
  JWT_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN: string;

  @IsString()
  @IsOptional()
  SEED_USER_EMAIL: string;

  @IsString()
  @IsOptional()
  SEED_USER_PASSWORD: string;

  @IsString()
  @IsOptional()
  SEED_USER_NAME: string;
}

export function validate(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validated;
}
