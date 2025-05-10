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
import { KafkaMessageContext } from './types/kafka-interface.type';
import { KafkaProcessor } from './processing/kafka.processor';

@Injectable()
export class KafkaConsumerService
  implements OnModuleInit, OnApplicationShutdown
{
  private readonly logger = new Logger(KafkaConsumerService.name);
  private consumer: KafkaConsumer;
  private isRunning = false;
  private heartbeatInterval: number;
  private kafkaConfig: KafkaConfig;
  private readonly useBatchProcessing: boolean = true;
  constructor(
    private readonly configService: ConfigService,
    private readonly kafkaConnection: KafkaConnection,
    private readonly kafkaLogger: KafkaLogger,
    private readonly processor: KafkaProcessor,
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

    this.consumer = await this.kafkaConnection.createConsumer(this.kafkaLogger);

    this.run();
  }

  public run(): void {
    if (this.isRunning) {
      this.logger.warn('Kafka consumer already running. Skipping re-run.');
      return;
    }
    this.isRunning = true;

    const subscription = this.consumer.subscription();
    this.logger.log(
      `Current topic subscription: ${JSON.stringify(subscription)}`,
    );

    this.logger.log('Single message consumption mode enabled');
    this.consumer.consume();
    this.consumer.on('data', (message: Message) => {
      this.logger.debug(
        `Received Kafka message | topic: "${message.topic}", partition: ${message.partition}, offset: ${message.offset}`,
      );
      this.handleMessage(message);
    });

    if (this.heartbeatInterval > 0) {
      setInterval(() => {
        if (this.consumer && this.isRunning) {
          this.logger.debug('Heartbeat interval active — consumer is alive');
        }
      }, this.heartbeatInterval);
    }

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
    if (!message || !message.value) return;

    const context: KafkaMessageContext = {
      topic: message.topic,
      partition: message.partition,
      offset: String(message.offset),
      timestamp: String(message.timestamp ?? ''),
      headers: message.headers?.reduce(
        (acc, header) => {
          Object.entries(header).forEach(([key, value]) => {
            acc[key] = value?.toString();
          });
          return acc;
        },
        {} as Record<string, string | undefined>,
      ),
      value: message.value,
      rawMessage: message,
      consumer: {
        topic: message.topic,
        partition: message.partition,
        offset: String(message.offset),
        timestamp: String(message.timestamp ?? ''),
        headers: message.headers?.reduce(
          (acc, header) => {
            Object.entries(header).forEach(([key, value]) => {
              acc[key] = value?.toString();
            });
            return acc;
          },
          {} as Record<string, string | undefined>,
        ),
      },
      autoCommit: this.kafkaConfig.autoCommit,
    };

    void (async () => {
      try {
        await this.processor.process(context, this.useBatchProcessing);
      } catch (err: unknown) {
        const errorMessage =
          typeof err === 'object' && err !== null && 'message' in err
            ? String((err as { message: unknown }).message)
            : String(err);
        this.logger.error(
          `Failed to process message [${message.topic}:${message.partition}:${message.offset}]: ${errorMessage}`,
        );
      }
    })();
  }

  private commit(context: KafkaMessageContext, message: Message): void {
    if (!context.autoCommit && context.consumer) {
      try {
        this.consumer.commitMessage(message);
        this.logger.debug(
          `Manually committed offset ${message.offset} for ${context.topic}[${context.partition}]`,
        );
      } catch (commitErr) {
        this.logger.error(
          `Error committing offset ${message.offset} for ${context.topic}[${context.partition}]: ${
            commitErr instanceof Error ? commitErr.message : commitErr
          }`,
          commitErr instanceof Error ? commitErr.stack : undefined,
        );
      }
    }
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
