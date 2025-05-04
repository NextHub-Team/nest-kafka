import { registerAs } from '@nestjs/config';
import { KafkaConfig } from './kafka-config.type';

export default registerAs<KafkaConfig>(
  'kafka',
  (): KafkaConfig => ({
    clientId: process.env.KAFKA_CLIENT_ID || 'nestjs-kafka-consumer',
    brokers: (process.env.KAFKA_BROKER || '').split(','),
    groupId: process.env.KAFKA_GROUP_ID || 'nestjs-consumer-group',
    ssl: process.env.KAFKA_ENABLE_SSL === 'true',
    sslOptions: {
      ca: process.env.KAFKA_SSL_CA_FILE || '',
      cert: process.env.KAFKA_SSL_CERT_FILE || '',
      key: process.env.KAFKA_SSL_KEY_FILE || '',
      rejectUnauthorized: process.env.KAFKA_SSL_CHECK_HOSTNAME !== 'false',
    },
    topics: (process.env.KAFKA_TOPICS || '').split(',').reduce(
      (acc, entry) => {
        const [key, value] = entry.split(':');
        if (key && value) acc[key.trim()] = value.trim();
        return acc;
      },
      {} as Record<string, string>,
    ),
    subscribeFromBeginning:
      process.env.KAFKA_SUBSCRIBE_FROM_BEGINNING === 'true',
    autoCommit: process.env.KAFKA_ENABLE_AUTO_COMMIT === 'true',
    offsetReset: process.env.KAFKA_AUTO_OFFSET_RESET || 'earliest',
    debug: process.env.KAFKA_DEBUG === 'true',
    heartbeatInterval: parseInt(
      process.env.KAFKA_HEARTBEAT_INTERVAL_MS || '5000',
      10,
    ),
    sessionTimeout: parseInt(
      process.env.KAFKA_SESSION_TIMEOUT_MS || '30000',
      10,
    ),
    requestTimeout: parseInt(
      process.env.KAFKA_REQUEST_TIMEOUT_MS || '30000',
      10,
    ),
  }),
);
