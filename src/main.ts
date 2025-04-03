import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';

dotenv.config(); // Load environment variables

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);

  const logger = new Logger('Bootstrap');
  logger.log('Application started successfully and is listening at http://localhost:3000/health');
}

bootstrap();
