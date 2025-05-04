export interface KafkaSslConfig {
  ca: string;
  cert: string;
  key: string;
  rejectUnauthorized: boolean;
}

export interface KafkaConfig {
  clientId: string;
  brokers: string[];
  groupId: string;
  ssl: boolean;
  sslOptions: KafkaSslConfig;
  topics: Record<string, string>;
  subscribeFromBeginning: boolean;
  autoCommit: boolean;
  offsetReset: string;
  debug: boolean;
  heartbeatInterval: number;
  sessionTimeout: number;
  requestTimeout: number;
}
