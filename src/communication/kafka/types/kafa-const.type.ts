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

export const DEFAULT_KAFKA_FETCH_MIN_BYTES: number = 1024;
export const DEFAULT_KAFKA_FETCH_MAX_BYTES: number = 2097152;
export const DEFAULT_KAFKA_FETCH_WAIT_MAX_MS: number = 1000;
export const DEFAULT_KAFKA_MAX_PARTITION_FETCH_BYTES: number = 2097152;
export const DEFAULT_KAFKA_MAX_POLL_INTERVAL_MS: number = 600000;
export const DEFAULT_KAFKA_AUTO_COMMIT_INTERVAL_MS: number = 10000;
export const DEFAULT_KAFKA_BATCH_SIZE: number = 100;
export const DEFAULT_KAFKA_BUFFER_TIME_MS: number = 10000;
export const DEFAULT_KAFKA_ENABLE_RECONNECT: boolean = true;
export const DEFAULT_KAFKA_RESTART_ON_FAILURE: boolean = true;
export const DEFAULT_KAFKA_ENABLE_PARTITION_LOGGING: boolean = false;
export const DEFAULT_KAFKA_DISABLE_HEARTBEAT_LOG: boolean = false;
export const DEFAULT_KAFKA_ENABLE_LOGGING: boolean = true;
export const DEFAULT_KAFKA_BATCH_HEARTBEAT: boolean = false;

export const DEFAULT_KAFKA_WORKER_CONCURRENCY = 3;
export const DEFAULT_KAFKA_MESSAGE_CONCURRENCY = 50;
