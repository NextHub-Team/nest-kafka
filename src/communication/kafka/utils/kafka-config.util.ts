/**
 * Ensures an environment variable is returned as a boolean.
 * Defaults to false if not explicitly 'true'.
 */
export function parseBoolean(value?: string, defaultValue = false): boolean {
  return value?.toLowerCase() === 'true' || defaultValue;
}

/**
 * Parses a string into a number. Returns default if not parsable.
 */
export function parseNumber(value?: string, defaultValue = 0): number {
  const parsed = Number(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Parses a comma-separated string into an array.
 */
export function parseStringArray(value?: string): string[] {
  return value ? value.split(',').map((s) => s.trim()) : [];
}

/**
 * Parses Kafka topic config string in format: key:value,key2:value2
 * Returns a key-value mapping.
 */
export function parseTopicMap(value?: string): Record<string, string> {
  const map: Record<string, string> = {};
  if (!value) return map;

  value.split(',').forEach((entry) => {
    const [key, val] = entry.split(':');
    if (key && val) {
      map[key.trim()] = val.trim();
    }
  });

  return map;
}
