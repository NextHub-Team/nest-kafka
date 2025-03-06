import * as dotenv from 'dotenv';
dotenv.config();

export const kafkaConfig = {
  client: {
    brokers: [process.env.KAFKA_BROKER  || 'broker-exposed.command.verot.dev.vdp.vero.host:443'],
    clientId: process.env.KAFKA_CLIENT_ID || 'vault-kafka-cosnumer',
  },
  consumer: {
    groupId: process.env.KAFKA_GROUP_ID || 'vault-kafka-group',
    allowAutoTopicCreation: true,
    sessionTimeout: 30000,
  },
  topics: {
    postcomment: 'vdp.v1.postcomment',
    postlike: 'vdp.v1.postlike',
    userfollowing: 'vdp.v1.userfollowing'
  },
};
