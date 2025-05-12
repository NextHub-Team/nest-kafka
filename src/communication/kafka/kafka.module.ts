import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { KafkaService } from './kafka.service';
import { KafkaConsumerService } from './kafka.consumer';
import { KafkaProcessor } from './kafka.processor';
import { DeserializeProcessor } from './deserialize.processor';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),
    BullModule.registerQueue({
      name: 'kafka-deserialize',
    }),
  ],
  providers: [
    KafkaService,
    KafkaConsumerService,
    KafkaProcessor,
    DeserializeProcessor,
  ],
  exports: [KafkaService],
})
export class KafkaModule {}
