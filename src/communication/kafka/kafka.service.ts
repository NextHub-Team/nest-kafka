import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { KafkaConsumerService } from './kafka.consumer';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);

  constructor(private readonly consumerService: KafkaConsumerService) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('Initializing KafkaService...');
    await this.start();
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Destroying KafkaService... Waiting for Kafka shutdown...');
    try {
      await this.stop();
      this.logger.log('KafkaService shutdown completed.');
    } catch (error) {
      this.logger.error('Error during KafkaService shutdown', error);
    }
  }

  async start(): Promise<void> {
    this.logger.log('Starting Kafka consumer...');
    if (!(await this.consumerService.isConnected?.())) {
      await this.consumerService.onModuleInit();
    } else {
      this.logger.log(
        'Kafka consumer already connected. Skipping initialization.',
      );
    }
  }

  async stop(): Promise<void> {
    this.logger.log('Stopping Kafka consumer...');
    await this.consumerService.onApplicationShutdown();
  }
}
