import 'reflect-metadata';
import 'dotenv/config';

import { McpApplicationFactory } from '@nitrostack/core';
import { EcoShiftModule } from './registerTools';

async function bootstrap() {
  const server = await McpApplicationFactory.create(EcoShiftModule);
  await server.start();
}

bootstrap();