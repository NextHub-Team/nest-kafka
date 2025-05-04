import { Logger } from '@nestjs/common';
import { KafkaConsumer } from '@confluentinc/kafka-javascript';

export class KafkaLogger {
  private readonly logger = new Logger('KafkaConsumer');

  attachToKafkaClient(client: {
    on: (event: string, listener: (...args: any[]) => void) => void;
  }): void {
    client.on('ready', () => {
      this.logger.log('Kafka client is ready and connected.');
    });

    client.on('data', ({ topic, partition, offset }) => {
      this.logger.log(
        `Received message | Topic: ${topic}, Partition: ${partition}, Offset: ${offset}`,
      );
    });

    client.on('event.error', (error: unknown) => {
      if (error instanceof Error) {
        this.logger.error(`Kafka error: ${error.message}`, error.stack);
      } else {
        this.logger.error(`Kafka error: ${JSON.stringify(error)}`);
      }
    });

    client.on('disconnected', () => {
      this.logger.warn('Kafka client disconnected.');
    });

    client.on('event.log', (entry: any) => {
      this.logger.debug(`Kafka internal log: ${JSON.stringify(entry)}`);
    });
  }
}
