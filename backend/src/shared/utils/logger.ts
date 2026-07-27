type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  requestId?: string;
  service?: string;
  [key: string]: unknown;
}

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private readonly minLevel: number;
  private context: Record<string, unknown> = {};

  constructor(private readonly service: string) {
    const level = (process.env['LOG_LEVEL'] ?? 'info') as LogLevel;
    this.minLevel = LEVELS[level] ?? LEVELS.info;
  }

  withContext(context: Record<string, unknown>): Logger {
    const child = new Logger(this.service);
    child.context = { ...this.context, ...context };
    return child;
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.log('debug', message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.log('warn', message, meta);
  }

  error(message: string, error?: unknown, meta?: Record<string, unknown>): void {
    const errorMeta =
      error instanceof Error
        ? { errorName: error.name, errorMessage: error.message, stack: error.stack }
        : { error };
    this.log('error', message, { ...errorMeta, ...meta });
  }

  private log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    if (LEVELS[level] < this.minLevel) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      service: this.service,
      ...this.context,
      ...meta,
    };

    const output = JSON.stringify(entry);

    if (level === 'error' || level === 'warn') {
      console.error(output);
    } else {
      console.log(output);
    }
  }
}

export function createLogger(service: string): Logger {
  return new Logger(service);
}

export type { Logger };
