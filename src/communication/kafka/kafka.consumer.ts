import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ConsumerTopicConfig,
  KafkaConsumer,
  Message,
} from '@confluentinc/kafka-javascript';
import { KafkaConfig } from './config/kafka-config.type';
import {
  KafkaAutoOffsetReset,
  KafkaConsumeMode,
} from './types/kafa-const.enum';
import { KafkaMessageContext } from './types/kafka-interface.type';
import { KafkaProcessor } from './kafka.processor';

@Injectable()
export class KafkaConsumerService
  implements OnModuleInit, OnApplicationShutdown
{
  private readonly logger = new Logger(KafkaConsumerService.name);
  private consumer: KafkaConsumer;
  private isRunning = false;
  private kafkaConfig: KafkaConfig;
  private clientId: string;
  private isConsumerConnected = false;
  private isInitialized = false;
  private disconnecting = false;
  constructor(
    private readonly configService: ConfigService,
    private readonly processor: KafkaProcessor,
  ) {
    const rawConfig = this.configService.get<KafkaConfig>('kafka')!;
    this.kafkaConfig = {
      ...rawConfig,
      consumeMode: rawConfig.consumeMode ?? KafkaConsumeMode.SINGLE,
      batchHeartbeat: rawConfig.batchHeartbeat ?? true,
    };
    this.clientId = this.kafkaConfig.clientId;
  }

  async onModuleInit(): Promise<void> {
    if (this.isInitialized || this.isRunning) {
      this.logger.warn('Consumer already initialized or running. Skipping...');
      return;
    }
    this.isInitialized = true;

    const topicMap = this.kafkaConfig.topics;
    const topicList = Object.values(topicMap);

    this.logger.log(
      `Initializing Kafka consumer with topics: ${topicList.join(', ')}`,
    );

    if (this.consumer) {
      this.logger.warn('Existing consumer instance found. Disconnecting...');
      await this.disconnect();
      this.logger.log('Previous Kafka consumer instance disconnected.');
    }

    await this.createConsumer();

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

    this.logger.log(
      `${this.kafkaConfig.consumeMode} message consumption mode enabled`,
    );

    if (this.kafkaConfig.consumeMode === KafkaConsumeMode.SINGLE) {
      this.consumer.consume();
      this.consumer.on('data', (message: Message) => {
        this.logger.debug(
          `Received Kafka message | topic: "${message.topic}", partition: ${message.partition}, offset: ${message.offset}, consumerId: ${this.clientId}`,
        );
        this.handleMessage(message);
      });
    }

    if (this.kafkaConfig.consumeMode === KafkaConsumeMode.BATCH) {
      this.consumer.consume();
      this.consumer.on('data', (message: Message) => {
        this.logger.debug(
          `Received Kafka message | topic: "${message.topic}", partition: ${message.partition}, offset: ${message.offset}, consumerId: ${this.clientId}`,
        );
        this.handleMessage(message);
      });

      if (this.kafkaConfig.batchHeartbeat) {
        this.logger.debug('Batch heartbeat is enabled.');
      }
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
        await this.processor.process(
          context,
          this.kafkaConfig.consumeMode === KafkaConsumeMode.BATCH,
        );
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

  async disconnect(): Promise<void> {
    if (this.consumer && !this.disconnecting) {
      this.disconnecting = true;
      const start = Date.now();
      this.logger.log('Kafka consumer disconnect initiated...');
      return new Promise((resolve) => {
        this.consumer.unsubscribe?.();
        this.consumer.disconnect(() => {
          this.logger.log('Kafka consumer disconnected');
          this.isConsumerConnected = false;
          this.isRunning = false;
          this.isInitialized = false;
          this.disconnecting = false;
          const elapsed = Date.now() - start;
          this.logger.log(
            `Kafka consumer disconnect completed in ${elapsed}ms`,
          );
          resolve();
        });
      });
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async isConnected(): Promise<boolean> {
    return this.isConsumerConnected;
  }

  async createConsumer(): Promise<KafkaConsumer> {
    const clientConfig = {
      'bootstrap.servers': this.kafkaConfig.brokers.join(','),
      'client.id': this.kafkaConfig.clientId,
      'group.id': this.kafkaConfig.groupId,
      'enable.auto.commit': this.kafkaConfig.autoCommit,
      'request.timeout.ms': this.kafkaConfig.requestTimeout,
      'session.timeout.ms': this.kafkaConfig.sessionTimeout,
      'heartbeat.interval.ms': this.kafkaConfig.heartbeatInterval,
      'max.poll.interval.ms': this.kafkaConfig.maxPollInterval,
      ...(this.kafkaConfig.ssl && {
        'security.protocol': 'ssl',
        'ssl.ca.location': this.kafkaConfig.sslOptions.ca,
        'ssl.certificate.location': this.kafkaConfig.sslOptions.cert,
        'ssl.key.location': this.kafkaConfig.sslOptions.key,
        'ssl.endpoint.identification.algorithm': this.kafkaConfig.sslOptions
          .rejectUnauthorized
          ? 'https'
          : undefined,
      }),
    };

    const topicOptions: ConsumerTopicConfig = {
      'auto.offset.reset': this.kafkaConfig.offsetReset as KafkaAutoOffsetReset,
    };

    const consumer = new KafkaConsumer(clientConfig, topicOptions);

    return new Promise((resolve, reject) => {
      consumer.connect();

      // eslint-disable-next-line @typescript-eslint/no-misused-promises, @typescript-eslint/require-await
      consumer.on('ready', async () => {
        this.logger.log('Kafka consumer is connected and ready.');
        this.consumer = consumer;
        this.isConsumerConnected = true;
        consumer.subscribe(
          this.kafkaConfig.topics ? Object.values(this.kafkaConfig.topics) : [],
        );
        this.logger.log(
          `Subscribed to Kafka topics: ${Object.values(this.kafkaConfig.topics).join(', ')}`,
        );

        const assignments = consumer.assignments();
        this.logger.debug(
          `🔗 Assigned partitions: ${JSON.stringify(assignments)}`,
        );

        resolve(consumer);
        this.logger.log(
          `Consumer ready. Group ID: ${this.kafkaConfig.groupId}`,
        );
      });

      consumer.on('event.error', (err: unknown) => {
        const errorMessage =
          typeof err === 'object' && err !== null && 'message' in err
            ? String((err as { message: string }).message)
            : String(err);
        this.logger.error(`Kafka connection error: ${errorMessage}`);
        reject(new Error(errorMessage));
      });

      consumer.on('disconnected', () => {
        this.logger.warn('Kafka consumer has disconnected.');
        this.isConsumerConnected = false;
      });

      consumer.on('connection.failure', () => {
        void (async () => {
          this.logger.error(
            'connection failure detected. Attempting to reconnect once...',
          );
          try {
            await this.createConsumer();
            this.logger.log('consumer reconnected successfully.');
          } catch (error) {
            const errMsg =
              typeof error === 'object' && error !== null && 'message' in error
                ? String((error as { message: string }).message)
                : String(error);
            this.logger.error(`Kafka reconnection failed: ${errMsg}`);
          }
        })();
      });
    });
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.consumer && this.isRunning) {
      this.logger.log('Shutting down Kafka consumer...');
      await this.disconnect();
    }
    // isRunning and isInitialized are now reset in disconnect()
  }
}
