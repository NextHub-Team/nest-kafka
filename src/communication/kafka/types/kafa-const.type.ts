import { KafkaAutoOffsetReset } from './kafa-const.enum';

export type KafkaAutoOffsetResetType = keyof typeof KafkaAutoOffsetReset;

export const DEFAULT_KAFKA_ENABLE_SSL: boolean = false;
export const DEFAULT_KAFKA_BROKER: string = 'localhost:9092';
export const DEFAULT_KAFKA_CLIENT_ID: string = 'nestjs-kafka-client';
export const DEFAULT_KAFKA_GROUP_ID: string = 'nestjs-consumer-group';
export const DEFAULT_KAFKA_ENABLE_AUTO_COMMIT: boolean = false;
export const DEFAULT_KAFKA_AUTO_OFFSET_RESET: KafkaAutoOffsetReset =
  KafkaAutoOffsetReset.EARLIEST;
export const DEFAULT_KAFKA_HEARTBEAT_INTERVAL: number = 5000;
export const DEFAULT_KAFKA_SESSION_TIMEOUT: number = 30000;
export const DEFAULT_KAFKA_REQUEST_TIMEOUT: number = 30000;
