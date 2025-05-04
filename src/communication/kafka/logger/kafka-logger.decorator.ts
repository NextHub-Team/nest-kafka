import { Logger } from '@nestjs/common';

export function LogKafkaMetadata(
  logger = new Logger('KafkaConsumer'),
): MethodDecorator {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<any>,
  ) => {
    const originalMethod = descriptor.value as (
      topic: string,
      message: { partition: number; offset: string },
    ) => Promise<void>;

    descriptor.value = function (
      this: any,
      topic: string,
      message: { partition: number; offset: string },
    ): Promise<void> {
      if (message && typeof message === 'object') {
        const { partition, offset } = message;
        logger.log(
          `Received Kafka message | Topic: ${topic}, Partition: ${partition}, Offset: ${offset}`,
        );
      }

      return Promise.resolve(
        originalMethod.apply(this, [topic, message]) as unknown as void,
      );
    };

    return descriptor;
  };
}
