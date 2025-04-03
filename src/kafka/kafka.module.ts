import { Module } from '@nestjs/common';
import { kafkaConfig, TOPICS, SUBSCRIBE_FROM_BEGINNING } from './kafka.config';
import { KafkaConsumerService } from './kafka.consumer.service';

@Module({
  providers: [KafkaConsumerService],
  exports: [KafkaConsumerService],
})
export class KafkaModule {}