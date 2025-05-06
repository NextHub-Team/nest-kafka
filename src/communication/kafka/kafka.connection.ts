import { Injectable, Logger } from '@nestjs/common';
import { KafkaConsumer } from '@confluentinc/kafka-javascript';
import { ConfigService } from '@nestjs/config';
import { KafkaConfig } from './config/kafka-config.type';
import { KafkaLogger } from './logger/kafka-logger';
import { KafkaAutoOffsetReset } from './types/kafa-const.enum';

@Injectable()
export class KafkaConnection {
  private consumer?: KafkaConsumer;

  async disconnect(): Promise<void> {
    if (this.consumer) {
      return new Promise((resolve) => {
        this.consumer!.disconnect(() => {
          this.logger.log('Kafka consumer disconnected');
          resolve();
        });
      });
    }
  }

  isConnected(): boolean {
    return !!this.consumer?.isConnected?.();
  }
  private readonly logger = new Logger(KafkaConnection.name);
  private kafkaConfig: KafkaConfig;

  constructor(private readonly configService: ConfigService) {
    this.kafkaConfig = this.configService.get<KafkaConfig>('kafka')!;
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
    const kafkaLogger = new KafkaLogger();
    kafkaLogger.registerAllEvents(consumer);

    return new Promise((resolve, reject) => {
      consumer.connect();

      consumer.on('ready', () => {
        this.logger.log('Kafka consumer is connected and ready.');
        this.consumer = consumer;
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
    });
  }
}
