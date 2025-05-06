import { KafkaConsumer } from '@confluentinc/kafka-javascript';
import { Injectable, Logger } from '@nestjs/common';
import { Message } from '@confluentinc/kafka-javascript';
import { KafkaMessageContext } from '../types/kafka-interface.type';
import { KafkaDispatcherService } from './kafka.dispatcher';
import { KafkaDeserializerService } from './kafka.deserializer';

@Injectable()
export class KafkaProcessor {
  private readonly logger = new Logger(KafkaProcessor.name);

  constructor(
    private readonly dispatcher: KafkaDispatcherService,
    private readonly deserializer: KafkaDeserializerService,
  ) {}

  /**
   * Entry point to process an incoming Kafka message
   */
  async process(
    message: Message,
    context: KafkaMessageContext & {
      consumer?: KafkaConsumer;
      autoCommit?: boolean;
    },
  ): Promise<void> {
    try {
      if (!message.value) {
        this.logger.warn(`Received null message on topic ${context.topic}`);
        return;
      }

      const payload: unknown = this.deserializer.deserialize(
        message.value,
        context.topic,
      );
      const routeKey = this.resolveRouteKey(context);

      this.logger.log(`Dispatching message to route: ${routeKey}`);
      await this.dispatcher.dispatch(routeKey, payload, context);

      if (!context.autoCommit && context.consumer) {
        try {
          context.consumer.commitMessage(message);
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
    } catch (error) {
      this.logger.error(
        `Error processing message at ${context.topic}[${context.partition}] offset ${context.offset}: ${
          error instanceof Error ? error.message : error
        }`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * Resolve routing key from message context
   */
  private resolveRouteKey(context: KafkaMessageContext): string {
    if (!context.topic) {
      throw new Error('Unable to route message: topic name missing in context');
    }
    return context.topic;
  }
}
