import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { Consumer, Kafka, EachMessagePayload, logLevel } from 'kafkajs';
import { kafkaConfig } from './kafka.config';

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private kafka: Kafka;
  private consumer: Consumer;
  private isConnected = false; // Prevent multiple connections

  constructor() {
    this.kafka = new Kafka({
      clientId: kafkaConfig.client.clientId,
      brokers: kafkaConfig.client.brokers,
      // Custom log creator: redirect KafkaJS logs to the NestJS logger
      logCreator: () => {
        return ({ namespace, level, log }) => {
          const { message } = log;
          if (level === logLevel.ERROR) {
            this.logger.error(`[${namespace}] ${message}`);
          } else if (level === logLevel.WARN) {
            this.logger.warn(`[${namespace}] ${message}`);
          } else if (level === logLevel.INFO) {
            this.logger.log(`[${namespace}] ${message}`);
          } else if (level === logLevel.DEBUG) {
            this.logger.debug(`[${namespace}] ${message}`);
          } else {
            this.logger.log(`[${namespace}] ${message}`);
          }
        };
      },
    });

    this.consumer = this.kafka.consumer({ groupId: kafkaConfig.consumer.groupId });
  }

  async onModuleInit() {
    if (!this.isConnected) {
      await this.connect();
      this.isConnected = true; // Mark as connected
    }
  }

  async connect() {
    try {
      if (!this.isConnected) {
        await this.consumer.connect();
        await this.consumer.subscribe({
          topic: kafkaConfig.topics.MyTopic,
          fromBeginning: true,
        });

        this.logger.log(
          `Connected to Kafka and subscribed to topic: ${kafkaConfig.topics.MyTopic}`,
        );

        await this.consumer.run({
          eachMessage: ({ topic, partition, message }: EachMessagePayload): Promise<void> => {
            const value = message.value?.toString() || '';
            this.logger.log(
              `Received message from ${topic} - Partition ${partition}: ${value}`,
            );

            // Process the message
            this.processMessage(value);

            return Promise.resolve();
          },
        });
        this.isConnected = true;
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(
          `Kafka Consumer Error: ${error.message}`,
          error.stack || '',
        );
      } else {
        this.logger.error(`Kafka Consumer Error: ${String(error)}`);
      }
      setTimeout(() => {
        void this.connect();
      }, 5000);
    }
  }

  async onModuleDestroy() {
    await this.consumer.disconnect();
    this.logger.log('Kafka Consumer Disconnected.');
    this.isConnected = false;
  }

  processMessage(message: string) {
    try {
      this.logger.log(`Processing message: ${message}`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`Error processing message: ${error.message}`);
      } else {
        this.logger.error(`Error processing message: ${String(error)}`);
      }
    }
  }
}
