import { Injectable, Logger } from '@nestjs/common';

export interface KafkaDeserializer<T = any> {
  deserialize(buffer: Buffer, topic: string): T;
}

@Injectable()
export class KafkaDeserializerService implements KafkaDeserializer {
  private readonly logger = new Logger(
    KafkaDeserializerService.name.replace('Service', ''),
  );

  deserialize(buffer: Buffer, topic: string): any {
    try {
      const jsonString = buffer.toString();
      return JSON.parse(jsonString);
    } catch (error) {
      this.logger.error(
        `Failed to deserialize message from topic "${topic}": ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }
}
