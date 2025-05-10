import { Injectable, Logger } from '@nestjs/common';
import { KafkaConsumer } from '@confluentinc/kafka-javascript';
import { ConfigService } from '@nestjs/config';
import { KafkaConfig } from './config/kafka-config.type';
import { KafkaAutoOffsetReset } from './types/kafa-const.enum';
import { KafkaLogger } from './logger/kafka-logger';

@Injectable()
export class KafkaConnection {
  private consumer?: KafkaConsumer;
  private isConsumerConnected = false;

  async disconnect(): Promise<void> {
    if (this.consumer) {
      return new Promise((resolve) => {
        this.consumer!.disconnect(() => {
          this.logger.log('Kafka consumer disconnected');
          this.isConsumerConnected = false;
          resolve();
        });
      });
    }
  }

  isConnected(): boolean {
    return this.isConsumerConnected;
  }
  private readonly logger = new Logger(KafkaConnection.name);
  private kafkaConfig: KafkaConfig;

  constructor(private readonly configService: ConfigService) {
    this.kafkaConfig = this.configService.get<KafkaConfig>('kafka')!;
  }

  async createConsumer(kafkaLogger: KafkaLogger): Promise<KafkaConsumer> {
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

    const topicOptions = {
      'auto.offset.reset': this.kafkaConfig.offsetReset as KafkaAutoOffsetReset,
    };

    const consumer = new KafkaConsumer(clientConfig, topicOptions);

    return new Promise((resolve, reject) => {
      consumer.connect();

      consumer.on('ready', () => {
        this.logger.log('Kafka consumer is connected and ready.');
        this.consumer = consumer;
        this.isConsumerConnected = true;
        consumer.subscribe(
          this.kafkaConfig.topics ? Object.values(this.kafkaConfig.topics) : [],
        );
        this.logger.log(
          `Subscribed to Kafka topics: ${Object.values(this.kafkaConfig.topics).join(', ')}`,
        );
        kafkaLogger.registerAllEvents(consumer);
        resolve(consumer);
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
            'Kafka consumer connection failure detected. Attempting to reconnect once...',
          );
          try {
            await this.createConsumer(kafkaLogger);
            this.logger.log('Kafka consumer reconnected successfully.');
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
}
