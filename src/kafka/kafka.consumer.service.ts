import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import {
  kafkaConfig,
  TOPICS,
  SUBSCRIBE_FROM_BEGINNING,
  DEBUG_ENABLED,
  AUTO_COMMIT,
} from './kafka.config';
import { KafkaConsumer } from '@confluentinc/kafka-javascript';

import {
  CreatePostCommentMessage,
} from '@protos/vero/socialrepository/v1_1_1/verosocialpostattr_postcomment/postcomment_pb';
import { Envelope } from '@protos/vero/services/v1/services_pb';

import {
  CreateUserFollowingMessage,
} from '@protos/vero/socialrepository/v1_1_1/verosocialfollow_userfollowing/userfollowing_pb';

import {CreatePostLikeMessage} from '../../server/grpc/protos/generated/vero/socialrepository/v1_1_1/verosocialpostattr_postlike/postlike_pb'
@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private readonly debugEnabled = DEBUG_ENABLED;
  private consumer: any;
  private isConnected = false;

  getMessageClass(typeUrl: string): any {
    switch (typeUrl) {
      case 'vero.socialrepository.v1_1_1.verosocialpostattr_postcomment.CreatePostCommentMessage':
        return CreatePostCommentMessage;
      case 'vero.socialrepository.v1_1_1.verosocialfollow_userfollowing.CreateUserFollowingMessage':
        return CreateUserFollowingMessage;
      case 'vero.socialrepository.v1_1_1.verosocialpostattr_postlike.CreatePostLikeMessage':
        return CreatePostLikeMessage
      default:
        throw new Error(`Unknown message type: ${typeUrl}`);
    }
  }

  async onModuleInit() {
    if (!this.isConnected) {
      this.logger.log('KafkaConsumerService initializing...');
      await this.connect();
    }
  }

  async connect() {
    try {
      const consumer = new KafkaConsumer({
        'bootstrap.servers': kafkaConfig.client.brokers.join(','),
        'security.protocol': 'ssl',
        'ssl.ca.location': process.env.KAFKA_SSL_CA_FILE,
        'ssl.certificate.location': process.env.KAFKA_SSL_CERT_FILE,
        'ssl.key.location': process.env.KAFKA_SSL_KEY_FILE,
        'group.id': kafkaConfig.consumer.groupId,
        'enable.auto.commit': AUTO_COMMIT,
      }, {
        'auto.offset.reset': SUBSCRIBE_FROM_BEGINNING ? 'earliest' : 'latest'
      });

      this.consumer = consumer;

      consumer.connect();

      consumer.on('ready', async () => {
        this.logger.log('Kafka consumer is READY and connected.');
        await this.subscribeToTopics();

        consumer.consume();
        this.logger.log('Kafka consumer is running.');
        this.isConnected = true;
      });

      consumer.on('data', async (message) => {
        const value = message.value;
        const topic = message.topic;
        const partition = message.partition;
        const offset = message.offset;

        if (this.debugEnabled) {
          this.logger.debug(`Received Kafka message | topic: "${topic}", partition: ${partition}, offset: ${offset}`);
        } 
        await this.processMessage(topic, message);
      });

    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      const errStack = error instanceof Error ? error.stack : '';
      this.logger.error(`Kafka Consumer Connection Error: ${errMsg}`, errStack);

      setTimeout(() => void this.connect(), 5000);
    }
  }

  async subscribeToTopics() {
    const topics = Object.values(TOPICS);
    this.logger.log(`Subscribing to topics: ${topics.join(', ')}`);
    await this.consumer.subscribe(topics);
    topics.forEach((topic) => {
      this.logger.log(`Subscribed to topic: ${topic}`);
    });
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting Kafka consumer...');
    try {
      await this.consumer.disconnect();
      this.logger.log('Kafka Consumer disconnected successfully.');
    } catch (error) {
      this.logger.error('Error during Kafka consumer disconnection:', error);
    } finally {
      this.isConnected = false;
    }
  }

  async processMessage(topic: string, message: any) {
    try {
      const buffer = Buffer.from(message.value); // raw buffer

      // Step 1: Deserialize the envelope
      const envelope = Envelope.deserializeBinary(buffer);

      // Step 2: Get class name and inner message buffer
      const className = envelope.getClassname(); // e.g. 'vero.socialrepository.v1_1_1.CreatePostLikeMessage'
      const innerBuffer = envelope.getMessage_asU8(); // ByteString as Uint8Array

      // Step 4: Deserialize the inner message based on class
      try {
        const messageObject = this.getMessageClass(className).deserializeBinary(innerBuffer);
        if (this.debugEnabled) {
          this.logger.debug(`Envelope className: ${className}`);
          this.logger.debug(`Deserialized message: ${JSON.stringify(messageObject.toObject(), null, 2)}`);
        } else {
          this.logger.log(`Deserialized message of type ${className}`);
        }
      } catch (innerError: any) {
        this.logger.error(`Failed to deserialize inner message of type ${className}: ${innerError.message}`);
      }

    } catch (error: any) {
      this.logger.error(`Error deserializing message from ${topic}: ${error.message}`, error.stack);
    }
  }
}