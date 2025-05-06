import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KafkaConsumer, Message } from '@confluentinc/kafka-javascript';
import { KafkaLogger } from './logger/kafka-logger';
import { KafkaConfig } from './config/kafka-config.type';
import { KafkaConnection } from './kafka.connection';
import { KafkaConsumeMode } from './types/kafa-const.enum';

@Injectable()
export class KafkaConsumerService
  implements OnModuleInit, OnApplicationShutdown
{
  private readonly logger = new Logger(KafkaConsumerService.name);
  private consumer: KafkaConsumer;
  private isRunning = false;
  private heartbeatInterval: number;
  private kafkaConfig: KafkaConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly kafkaConnection: KafkaConnection,
    private readonly kafkaLogger: KafkaLogger,
  ) {
    const rawConfig = this.configService.get<KafkaConfig>('kafka')!;
    this.kafkaConfig = {
      ...rawConfig,
      consumeMode: rawConfig.consumeMode ?? KafkaConsumeMode.SINGLE,
      batchHeartbeat: rawConfig.batchHeartbeat ?? true,
    };
  }

  async onModuleInit(): Promise<void> {
    const config = this.kafkaConfig;
    const topicMap = this.kafkaConfig.topics;
    const topicList = Object.values(topicMap);

    this.heartbeatInterval = config.heartbeatInterval;

    this.logger.log(
      `Initializing Kafka consumer with topics: ${topicList.join(', ')}`,
    );

    this.consumer = await this.kafkaConnection.createConsumer();
    this.kafkaLogger.registerAllEvents(this.consumer);

    try {
      this.consumer.subscribe(topicList);
      this.logger.log(`Subscribed to Kafka topics: ${topicList.join(', ')}`);
    } catch (err) {
      this.logger.error(
        `Error subscribing to topics: ${(err as Error).message}`,
      );
    }

    this.run();
  }

  public run(): void {
    // Step 5.3 - Subscribe
    const subscription = this.consumer.subscription();
    this.logger.log(
      `Current topic subscription: ${JSON.stringify(subscription)}`,
    );

    const { consumeMode, batchHeartbeat } = this.kafkaConfig;
    if (consumeMode === KafkaConsumeMode.BATCH) {
      this.logger.log('Batch consumption mode enabled');
      this.pollBatch(100); // default batch size
    } else {
      this.logger.log('Single message consumption mode enabled');
      this.consumer.on('data', (message: Message) =>
        this.handleMessage(message),
      );
    }

    this.isRunning = true;

    if (
      consumeMode === KafkaConsumeMode.BATCH &&
      batchHeartbeat &&
      this.heartbeatInterval > 0
    ) {
      setInterval(() => {
        if (this.consumer && this.isRunning) {
          this.logger.debug('Heartbeat interval active — consumer is alive');
          // Note: KafkaConsumer does not expose a direct heartbeat method.
          // This is a placeholder to simulate liveness checks or monitoring.
        }
      }, this.heartbeatInterval);
    }

    // Step 5.2 - Register Events
    this.consumer.on('rebalance', (err, assignments) => {
      if (err) {
        this.logger.error(`Rebalance error: ${err.message}`);
      } else {
        this.logger.log(
          `Rebalance occurred. New assignments: ${JSON.stringify(assignments)}`,
        );
      }
    });

    this.consumer.on('offset.commit', (err, topicPartitions) => {
      if (err) {
        this.logger.error(`Offset commit error: ${err.message}`);
      } else {
        this.logger.debug(
          `Offset commit successful for: ${JSON.stringify(topicPartitions)}`,
        );
      }
    });

    this.logger.log('Kafka consumer started and listening for messages...');
  }

  private handleMessage(message: Message): void {
    if (!message) return;

    // Step 5.1 - Initialize
    this.logger.debug(
      `Step 5.1 - Received message on topic ${message.topic}, partition ${message.partition}, offset ${message.offset}`,
    );

    try {
      // Step 1: Initialize and Validate Message
      if (!message.value) {
        this.logger.warn('Received Kafka message without value');
        return;
      }

      // Step 5.5 - Extract Context
      const context = {
        topic: message.topic,
        partition: message.partition,
        offset: message.offset,
        timestamp: message.timestamp,
        headers: message.headers,
      };

      this.logger.debug(`Step 2 - Parsed context: ${JSON.stringify(context)}`);

      // Step 5.6 - Dispatch Logic
      const decoded = message.value.toString(); // placeholder for deserialization
      this.logger.debug(
        `Step 3 - Decoded message from topic ${message.topic}: ${decoded}`,
      );

      // Step 4: Dispatch to Message Processor
      this.logger.debug(
        `Step 4 - Dispatching message to handler for topic ${message.topic}`,
      );

      // Step 5: Commit Offset
      if (!this.kafkaConfig.autoCommit) {
        this.commitMessage(message);
      }
    } catch (err) {
      // Step 5.7 - Error Handling
      this.logger.error(`Failed to process message: ${(err as Error).message}`);
    }
    // Step 5.8 - Heartbeat (Implicit via .on('data'))
  }

  private commitMessage(message: Message): void {
    try {
      this.consumer.commitMessage(message);
      this.logger.debug(
        `Committed offset ${message.offset} for ${message.topic}[${message.partition}]`,
      );
    } catch (err) {
      this.logger.error(
        `Failed to commit offset ${message.offset} for ${message.topic}[${message.partition}]: ${
          (err as Error).message
        }`,
      );
    }
  }

  private pollBatch(batchSize: number): void {
    const loop = async () => {
      while (this.isRunning) {
        this.consumer.consume(batchSize, (err, messages) => {
          if (err) {
            this.logger.error(`Batch consume error: ${err.message}`);
            return;
          }

          for (const message of messages) {
            this.handleMessage(message);
          }
        });

        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    };
    void loop();
  }

  async onApplicationShutdown(): Promise<void> {
    // Step 5.10 - Graceful Close
    if (this.consumer && this.isRunning) {
      this.logger.log('Shutting down Kafka consumer...');
      await new Promise<void>((resolve) => {
        this.consumer.disconnect(() => {
          this.logger.log('Kafka consumer disconnected');
          resolve();
        });
      });
    }
  }
}
