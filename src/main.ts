import { NestFactory } from '@nestjs/core';
import { KafkaConsumerService } from './kafka/kafka.consumer.service';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';

dotenv.config(); // Load environment variables

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const kafkaConsumer = app.get(KafkaConsumerService);

  await kafkaConsumer.connect(); // Start Kafka consumer
  await app.listen(3000);

  const logger = new Logger('Bootstrap');
  logger.log('🚀 Application is running on http://localhost:3000');
}

bootstrap();
