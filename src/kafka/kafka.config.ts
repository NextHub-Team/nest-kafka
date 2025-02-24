import * as dotenv from 'dotenv';
dotenv.config();

export const kafkaConfig = {
  client: {
    brokers: [process.env.KAFKA_BROKER || 'next-hub.app:9092'],
    clientId: process.env.KAFKA_CLIENT_ID || 'next-hub-consumer',
  },
  consumer: {
    groupId: process.env.KAFKA_GROUP_ID || 'test-consumer-group',
    allowAutoTopicCreation: true,
    sessionTimeout: 30000,
  },
  topics: {
    MyTopic: 'mytopic',
  },
};
