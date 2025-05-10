import { Module } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { KafkaConsumerService } from './kafka.consumer';
import { KafkaConnection } from './kafka.connection';
import { KafkaProcessor } from './processing/kafka.processor';
import { KafkaDispatcherService } from './processing/kafka.dispatcher';
import { KafkaDeserializerService } from './processing/kafka.deserializer';
import { KafkaLogger } from './logger/kafka-logger';

@Module({
  providers: [
    KafkaService,
    KafkaConsumerService,
    KafkaDispatcherService,
    KafkaDeserializerService,
    KafkaConnection,
    KafkaProcessor,
    KafkaLogger,
  ],
  exports: [KafkaService],
})
export class KafkaModule {}
