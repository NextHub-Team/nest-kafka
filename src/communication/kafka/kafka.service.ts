import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { KafkaConsumerService } from './kafka.consumer';
import { KafkaConnection } from './kafka.connection';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);

  constructor(
    private readonly consumerService: KafkaConsumerService,
    private readonly kafkaConnection: KafkaConnection,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('Initializing KafkaService...');
    await this.start();
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Destroying KafkaService...');
    await this.stop();
  }

  async start(): Promise<void> {
    this.logger.log('Starting Kafka consumer...');
    await this.consumerService.onModuleInit();
  }

  async stop(): Promise<void> {
    this.logger.log('Stopping Kafka consumer...');
    await this.consumerService.onApplicationShutdown();
  }

  healthCheck(): { status: boolean } {
    const isConnected = this.kafkaConnection.isConnected();
    return { status: isConnected };
  }
}
