import { LoggerService, Logger } from '@nestjs/common';
import { KafkaConsumer } from '@confluentinc/kafka-javascript';

export class KafkaLogger implements LoggerService {
  private readonly logger = new Logger('Kafka');

  log(message: string) {
    this.logger.log(message);
  }

  error(message: string, trace?: string) {
    this.logger.error(message, trace);
  }

  warn(message: string) {
    this.logger.warn(message);
  }

  debug(message: string) {
    this.logger.debug(message);
  }

  verbose(message: string) {
    this.logger.verbose(message);
  }

  registerAllEvents(consumer: KafkaConsumer): void {
    consumer.on('event.error', (err: unknown) => {
      let errorMessage = 'Unknown Kafka error';
      if (typeof err === 'object' && err !== null && 'message' in err) {
        const rawMessage = (err as { message?: unknown }).message;
        errorMessage =
          typeof rawMessage === 'string'
            ? rawMessage
            : JSON.stringify(rawMessage ?? 'No message');
      } else {
        errorMessage = String(err);
      }
      this.logger.error(`Kafka error: ${errorMessage}`);
    });
    consumer.on('event.log', (log) =>
      this.log(`Kafka log: ${JSON.stringify(log)}`),
    );
    consumer.on('event.stats', (stats) =>
      this.debug(`Kafka stats: ${JSON.stringify(stats)}`),
    );
    consumer.on('event.throttle', (throttle) =>
      this.warn(`Kafka throttle: ${JSON.stringify(throttle)}`),
    );
    consumer.on('rebalance', (err, assignments) => {
      if (err) {
        this.error(
          `Kafka rebalance error: ${
            typeof err === 'object' && err !== null && 'message' in err
              ? String((err as { message: string }).message)
              : String(err)
          }`,
        );
      } else {
        this.log(`Kafka rebalance: ${JSON.stringify(assignments)}`);
      }
    });
    consumer.on('offset.commit', (err, topicPartitions) => {
      if (err) {
        this.error(
          `Kafka offset commit error: ${
            typeof err === 'object' && err !== null && 'message' in err
              ? String((err as { message: string }).message)
              : String(err)
          }`,
        );
      } else {
        this.debug(
          `Kafka offset committed: ${JSON.stringify(topicPartitions)}`,
        );
      }
    });
  }
}
