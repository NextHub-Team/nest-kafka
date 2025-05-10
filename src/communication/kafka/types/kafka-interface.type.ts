export interface KafkaConsumerContext {
  topic: string;
  partition: number;
  offset: string;
  timestamp: string;
  headers?: Record<string, string | undefined>;
}

export interface KafkaMessageContext<T = unknown> {
  topic: string;
  partition: number;
  offset: string;
  timestamp: string;
  key?: string;
  headers?: Record<string, string | undefined>;
  value: T;
  rawMessage: any; // raw Kafka message object
  autoCommit: boolean;
  consumer: KafkaConsumerContext;
}
