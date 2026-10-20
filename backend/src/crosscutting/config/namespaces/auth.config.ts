import { registerAs, ConfigType } from '@nestjs/config';

const PLACEHOLDER_JWT_SECRET = 'finances-dev-jwt-secret-change-me';

/** Resolve o segredo JWT. Em produção exige JWT_SECRET; fora disso permite fallback local. */
export function resolveJwtSecret(jwtSecret: string | undefined): string {
  if (jwtSecret != null && jwtSecret.trim() !== '') {
    return jwtSecret;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET é obrigatório em produção');
  }
  return PLACEHOLDER_JWT_SECRET;
}

export const authConfig = registerAs('auth', () => ({
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
}));

export type AuthConfig = ConfigType<typeof authConfig>;
