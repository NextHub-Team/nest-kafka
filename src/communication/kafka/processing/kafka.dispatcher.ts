import { Injectable, Logger } from '@nestjs/common';
import { KafkaMessageContext } from '../types/kafka-interface.type';

@Injectable()
export class KafkaDispatcherService {
  private readonly logger = new Logger(
    KafkaDispatcherService.name.replace('Service', ''),
  );

  // Simulated routing map. In production, replace with dynamic or configurable mapping.
  private readonly topicHandlers: Record<
    string,
    (payload: any, context: KafkaMessageContext) => Promise<void>
  > = {};

  /**
   * Register a handler function for a specific topic.
   */
  registerHandler(
    topic: string,
    handler: (payload: any, context: KafkaMessageContext) => Promise<void>,
  ) {
    this.topicHandlers[topic] = handler;
    this.logger.log(`Registered handler for topic: ${topic}`);
  }

  /**
   * Dispatch a message to its corresponding topic handler.
   */
  async dispatch(
    topic: string,
    payload: any,
    context: KafkaMessageContext,
  ): Promise<void> {
    const handler = this.topicHandlers[topic];

    if (!handler) {
      this.logger.warn(`No handler registered for topic: ${topic}`);
      return;
    }

    try {
      await handler(payload, context);
      this.logger.debug(`Message dispatched for topic: ${topic}`);
    } catch (error) {
      this.logger.error(`Error handling message for topic ${topic}: ${error}`);
    }
  }
}
