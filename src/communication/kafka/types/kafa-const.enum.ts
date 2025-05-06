export enum KafkaAutoOffsetReset {
  EARLIEST = 'earliest',
  SMALLEST = 'smallest',
  BEGINNING = 'beginning',
  LARGEST = 'largest',
  LATEST = 'latest',
  END = 'end',
  ERROR = 'error',
}

export enum KafkaConsumeMode {
  SINGLE = 'single',
  BATCH = 'batch',
}
