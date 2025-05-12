import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { bufferTime, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { KafkaMessageContext } from './types/kafka-interface.type';
import {
  DEFAULT_KAFKA_BUFFER_TIME_MS,
  DEFAULT_KAFKA_BATCH_SIZE,
} from './types/kafa-const.type';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class KafkaProcessor implements OnModuleInit {
  private readonly message$ = new Subject<KafkaMessageContext>();
  private readonly BATCH_SIZE: number;
  private readonly BUFFER_TIME_MS: number;
  private readonly logger = new Logger(KafkaProcessor.name);
  private messageCount = 0;

  constructor(
    private readonly configService: ConfigService,
    @InjectQueue('kafka-deserialize') private readonly deserializeQueue: Queue,
  ) {
    this.BATCH_SIZE = this.configService.get<number>(
      'kafka.batchSize',
      DEFAULT_KAFKA_BATCH_SIZE,
    );
    this.BUFFER_TIME_MS = this.configService.get<number>(
      'kafka.bufferTimeMs',
      DEFAULT_KAFKA_BUFFER_TIME_MS,
    );
  }

  protected resolveRouteKey(context: KafkaMessageContext): string {
    if (!context.topic) {
      throw new Error('Unable to route message: topic name missing in context');
    }
    return context.topic;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async onModuleInit(): Promise<void> {
    this.message$
      .pipe(
        bufferTime(this.BUFFER_TIME_MS, undefined, this.BATCH_SIZE),
        filter((batch) => batch.length > 0),
      )
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      .subscribe(async (batch) => {
        this.logger.debug(`Buffered ${batch.length} messages`);
        try {
          await this.deserializeQueue.add('deserialize-batch', {
            batch,
          });
        } catch (err) {
          this.logger.error(
            'Batch processing failed:',
            err instanceof Error ? (err.stack ?? err.message) : String(err),
          );
        }
      });
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async process(context: KafkaMessageContext, useBatch = false): Promise<void> {
    if (useBatch) {
      this.message$.next(context);
      return;
    }

    try {
      this.messageCount++;
      this.logger.debug(`Message count so far: ${this.messageCount}`);
      this.logger.debug(
        `Processing message at ${context.topic}[${context.partition}] offset ${context.offset}`,
      );
      // Add real processing logic here
    } catch (error) {
      this.logger.error(
        `Error processing message at ${context.topic}[${context.partition}] offset ${context.offset}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
