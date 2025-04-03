import * as dotenv from 'dotenv';
import { Logger } from '@nestjs/common';

dotenv.config();

const logger = new Logger('KafkaConfig');

// Debug flag
export const DEBUG_ENABLED = process.env.KAFKA_DEBUG === 'true';

// Topics parser
const parseTopics = (topicsEnv: string | undefined): Record<string, string> => {
  const topics: Record<string, string> = {};
  if (!topicsEnv) {
    logger.warn('No topics defined in KAFKA_TOPICS');
    return topics;
  }

  topicsEnv.split(',').forEach((entry) => {
    const [key, value] = entry.split(':');
    if (key && value) {
      topics[key.trim()] = value.trim();
    }
  });

  logger.log(
    `Loaded topics: ${Object.entries(topics)
      .map(([k, v]) => `${k} => ${v}`)
      .join(', ')}`,
  );
  return topics;
};

// Exported parsed values
export const TOPICS = parseTopics(process.env.KAFKA_TOPICS);
export const SUBSCRIBE_FROM_BEGINNING = process.env.KAFKA_SUBSCRIBE_FROM_BEGINNING === 'true';

// Auto commit flag
export const AUTO_COMMIT = process.env.KAFKA_AUTO_COMMIT === 'true';

// SSL config
const sslEnabled = process.env.KAFKA_ENABLE_SSL === 'true';
const sslConfig = sslEnabled
  ? {
      ca: process.env.KAFKA_SSL_CA_FILE,
      cert: process.env.KAFKA_SSL_CERT_FILE,
      key: process.env.KAFKA_SSL_KEY_FILE,
      rejectUnauthorized: process.env.KAFKA_SSL_CHECK_HOSTNAME !== 'false',
    }
  : undefined;

if (sslEnabled) {
  logger.log('SSL is enabled and configured');
} else {
  logger.log('SSL is disabled');
}

if (DEBUG_ENABLED) {
  logger.log('Kafka debug mode is ENABLED');
}

// Final config object
export const kafkaConfig = {
  client: {
    brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
    clientId: process.env.KAFKA_CLIENT_ID || 'kafka-consumer',
    requestTimeout: parseInt(process.env.KAFKA_REQUEST_TIMEOUT_MS || '30000', 10),
    ssl: sslConfig,
  },
  consumer: {
    groupId: process.env.KAFKA_GROUP_ID || 'kafka-group',
    heartbeatInterval: parseInt(process.env.KAFKA_HEARTBEAT_INTERVAL_MS || '3000', 10),
    sessionTimeout: parseInt(process.env.KAFKA_SESSION_TIMEOUT_MS || '30000', 10),
    allowAutoTopicCreation: process.env.KAFKA_ALLOW_AUTO_TOPIC_CREATION !== 'false',
    autoOffsetReset: process.env.KAFKA_AUTO_OFFSET_RESET || 'earliest',
  },
};

logger.log('Kafka config loaded successfully.');