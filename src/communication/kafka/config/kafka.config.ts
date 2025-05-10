import { registerAs } from '@nestjs/config';
import { KafkaConfig } from './kafka-config.type';
import {
  DEFAULT_KAFKA_CLIENT_ID,
  DEFAULT_KAFKA_GROUP_ID,
  DEFAULT_KAFKA_AUTO_OFFSET_RESET,
  DEFAULT_KAFKA_HEARTBEAT_INTERVAL,
  DEFAULT_KAFKA_SESSION_TIMEOUT,
  DEFAULT_KAFKA_REQUEST_TIMEOUT,
} from '../types/kafa-const.type';
import { KafkaConsumeMode } from '../types/kafa-const.enum';
import {
  parseBoolean,
  parseNumber,
  parseTopicMap,
} from '../utils/kafka-config.util';

export default registerAs<KafkaConfig>(
  'kafka',
  (): KafkaConfig => ({
    clientId: process.env.KAFKA_CLIENT_ID || DEFAULT_KAFKA_CLIENT_ID,
    brokers: (process.env.KAFKA_BROKER || '').split(','),
    groupId: process.env.KAFKA_GROUP_ID || DEFAULT_KAFKA_GROUP_ID,
    ssl: parseBoolean(process.env.KAFKA_ENABLE_SSL),
    sslOptions: {
      ca: process.env.KAFKA_SSL_CA_FILE || '',
      cert: process.env.KAFKA_SSL_CERT_FILE || '',
      key: process.env.KAFKA_SSL_KEY_FILE || '',
      rejectUnauthorized: parseBoolean(
        process.env.KAFKA_SSL_CHECK_HOSTNAME,
        true,
      ),
    },
    topics: parseTopicMap(process.env.KAFKA_TOPICS),
    subscribeFromBeginning: parseBoolean(
      process.env.KAFKA_SUBSCRIBE_FROM_BEGINNING,
    ),
    autoCommit: parseBoolean(process.env.KAFKA_ENABLE_AUTO_COMMIT),
    offsetReset:
      process.env.KAFKA_AUTO_OFFSET_RESET || DEFAULT_KAFKA_AUTO_OFFSET_RESET,
    debug: parseBoolean(process.env.KAFKA_DEBUG),
    heartbeatInterval: parseNumber(
      process.env.KAFKA_HEARTBEAT_INTERVAL_MS,
      DEFAULT_KAFKA_HEARTBEAT_INTERVAL,
    ),
    sessionTimeout: parseNumber(
      process.env.KAFKA_SESSION_TIMEOUT_MS,
      DEFAULT_KAFKA_SESSION_TIMEOUT,
    ),
    requestTimeout: parseNumber(
      process.env.KAFKA_REQUEST_TIMEOUT_MS,
      DEFAULT_KAFKA_REQUEST_TIMEOUT,
    ),
    consumeMode:
      (process.env.KAFKA_CONSUME_MODE as KafkaConsumeMode) ||
      KafkaConsumeMode.SINGLE,
    batchHeartbeat: parseBoolean(process.env.KAFKA_BATCH_HEARTBEAT, true),
    maxPollInterval: parseNumber(process.env.KAFKA_MAX_POLL_INTERVAL_MS),
  }),
);
