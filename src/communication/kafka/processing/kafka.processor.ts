import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { bufferTime, Subject } from 'rxjs';
import { KafkaMessageContext } from '../types/kafka-interface.type';

abstract class KafkaBaseProcessor {
  protected readonly logger = new Logger(this.constructor.name);

  protected resolveRouteKey(context: KafkaMessageContext): string {
    if (!context.topic) {
      throw new Error('Unable to route message: topic name missing in context');
    }
    return context.topic;
  }

  abstract process(
    context: KafkaMessageContext,
    useBatch?: boolean,
  ): Promise<void>;
}

@Injectable()
export class KafkaProcessor extends KafkaBaseProcessor implements OnModuleInit {
  private readonly message$ = new Subject<KafkaMessageContext>();
  private readonly BATCH_SIZE = 100;
  private readonly BUFFER_TIME_MS = 1000;

  onModuleInit() {
    this.message$
      .pipe(bufferTime(this.BUFFER_TIME_MS, undefined, this.BATCH_SIZE))
      .subscribe((batch) => {
        void (async () => {
          this.logger.debug(`Buffered ${batch.length} messages`);
          try {
            for (const message of batch) {
              await this.process(message, false);
            }
            this.logger.debug(`Processed ${batch.length} messages`);
          } catch (err) {
            this.logger.error(
              'Batch processing failed:',
              err instanceof Error ? (err.stack ?? err.message) : String(err),
            );
          }
        })();
      });
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async process(context: KafkaMessageContext, useBatch = false): Promise<void> {
    if (useBatch) {
      this.message$.next(context);
      return;
    }

    try {
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
