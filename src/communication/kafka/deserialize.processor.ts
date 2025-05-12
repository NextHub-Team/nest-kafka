import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import pMap from 'p-map';
import { performance } from 'node:perf_hooks';
import { KafkaMessageContext } from './types/kafka-interface.type';
import { DEFAULT_KAFKA_MESSAGE_CONCURRENCY } from './types/kafa-const.type';
import Redis from 'ioredis';

@Processor('kafka-deserialize')
export class DeserializeProcessor
  extends WorkerHost
  implements OnApplicationShutdown
{
  private readonly logger = new Logger(DeserializeProcessor.name);
  private readonly redis: Redis;

  constructor(private readonly configService: ConfigService) {
    super();
    this.redis = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      retryStrategy: (times) => Math.min(times * 100, 3000),
    });

    this.redis.on('connect', () => this.logger.log('Redis connected'));
    this.redis.on('reconnecting', () =>
      this.logger.warn('Redis reconnecting...'),
    );
    this.redis.on('error', (err) =>
      this.logger.error(`Redis error: ${err.message}`),
    );
    this.redis.on('end', () => this.logger.warn('Redis connection closed'));
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async onApplicationShutdown(signal: string) {
    this.logger.warn(`Shutting down worker due to ${signal}`);
  }

  async process(job: Job<{ batch: KafkaMessageContext[] }>): Promise<any[]> {
    const { batch } = job.data;
    this.logger.debug(`Deserializing batch of ${batch.length} messages...`);

    if (this.redis.status !== 'ready') {
      this.logger.warn('Redis not ready, skipping batch');
      throw new Error('Redis is not connected');
    }

    try {
      const concurrency = this.configService.get<number>(
        'kafka.messageConcurrency',
        DEFAULT_KAFKA_MESSAGE_CONCURRENCY,
      );

      const start = performance.now();

      const deserialized = await pMap(
        batch,
        // eslint-disable-next-line @typescript-eslint/require-await
        async (message) => ({
          topic: message.topic,
          partition: message.partition,
          offset: message.offset,
          timestamp: message.timestamp,
          value: message.value?.toString() ?? null,
          headers: message.headers,
          key: message.key,
        }),
        { concurrency },
      );

      const durationMs = performance.now() - start;
      const throughput = deserialized.length / (durationMs / 1000);

      this.logger.debug(
        `Successfully deserialized ${deserialized.length} messages`,
      );
      this.logger.log(`Job completed in ${durationMs.toFixed(2)} ms`);
      this.logger.log(`Throughput: ${throughput.toFixed(2)} messages/sec`);

      return deserialized;
    } catch (error) {
      this.logger.error(
        'Deserialization failed',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }
}
