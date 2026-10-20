import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { useContainer } from 'class-validator';
import { AppModule } from './app.module';
import { serverConfig } from './crosscutting/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const srv = app.get<ConfigType<typeof serverConfig>>(serverConfig.KEY);
  const isDev = srv.env === 'development' || srv.env === 'test';
  const allowAllOrigins = srv.corsOrigin === true;
  const allowedOrigins: string[] = Array.isArray(srv.corsOrigin)
    ? srv.corsOrigin
    : typeof srv.corsOrigin === 'string'
      ? [srv.corsOrigin]
      : [];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowAllOrigins) return callback(null, true);
      if (isDev && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      if (allowedOrigins.length > 0) {
        return callback(null, allowedOrigins.includes(origin));
      }
      if (isDev) return callback(null, true);
      callback(null, false);
    },
    credentials: true,
  });

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableShutdownHooks();

  await app.listen(srv.port, '0.0.0.0');
  console.log(`Finances API listening on http://0.0.0.0:${srv.port}/api`);
  console.log(
    'Routes: /api/health · /api/auth/* · /api/periods/* · /api/accounts/* · /api/parties/* · /api/entries/* · /api/recurring-series/*',
  );
}


bootstrap().catch((err) => {
  console.error('Failed to bootstrap Finances API', err);
  process.exit(1);
});
