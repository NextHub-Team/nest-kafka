import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { KafkaModule } from './kafka/kafka.module';
import { KafkaConsumerService } from './kafka/kafka.consumer.service';

@Module({
  imports: [KafkaModule],
  controllers: [AppController],
  providers: [AppService, KafkaConsumerService],
})
export class AppModule {}
