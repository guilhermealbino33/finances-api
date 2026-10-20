import { readFileSync } from 'fs';
import { join } from 'path';
import { Controller, Get } from '@nestjs/common';
import type { HealthResponse } from '@finances/shared';

function readApiVersion(): string {
  try {
    const pkgPath = join(__dirname, '..', '..', '..', 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { version?: string };
    return typeof pkg.version === 'string' ? pkg.version : 'unknown';
  } catch {
    return 'unknown';
  }
}

@Controller('health')
export class HealthController {
  @Get()
  check(): HealthResponse {
    return {
      status: 'ok',
      service: 'finances-api',
      version: readApiVersion(),
      timestamp: new Date().toISOString(),
    };
  }
}
