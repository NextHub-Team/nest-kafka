import { LoggerService, Logger } from '@nestjs/common';

export class KafkaLogger implements LoggerService {
  private readonly logger = new Logger('KafkaConsumer');

  log(message: string) {
    this.logger.log(message);
  }

  error(message: string, trace?: string) {
    this.logger.error(message, trace);
  }

  warn(message: string) {
    this.logger.warn(message);
  }

  debug(message: string) {
    this.logger.debug(message);
  }

  verbose(message: string) {
    this.logger.verbose(message);
  }
}
