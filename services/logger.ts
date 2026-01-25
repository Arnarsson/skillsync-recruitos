 
/**
 * Centralized logging service with environment-aware output
 * Prevents console statements in production builds
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  service?: string;
  operation?: string;
  metadata?: Record<string, unknown>;
}

const isDevelopment = typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';

class Logger {
  private shouldLog(level: LogLevel): boolean {
    // In production, only log warnings and errors
    if (!isDevelopment && (level === 'debug' || level === 'info')) {
      return false;
    }
    return true;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const prefix = context?.service ? `[${context.service}]` : '';
    const operation = context?.operation ? `[${context.operation}]` : '';
    return `${timestamp} ${level.toUpperCase()} ${prefix}${operation} ${message}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, context), context?.metadata || '');
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, context), context?.metadata || '');
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context), context?.metadata || '');
    }
  }

  error(message: string, error?: unknown, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const errorDetails = error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error;

      console.error(
        this.formatMessage('error', message, context),
        errorDetails,
        context?.metadata || ''
      );
    }
  }

  // Structured logging for specific events
  apiCall(service: string, operation: string, success: boolean, duration?: number): void {
    const message = success
      ? `API call succeeded${duration ? ` (${duration}ms)` : ''}`
      : 'API call failed';

    this.info(message, {
      service,
      operation,
      metadata: { success, duration },
    });
  }

  // Database operation logging
  dbOperation(operation: string, table: string, success: boolean, error?: unknown): void {
    if (success) {
      this.info(`Database operation succeeded`, {
        service: 'Database',
        operation: `${operation}:${table}`,
      });
    } else {
      this.error(`Database operation failed`, error, {
        service: 'Database',
        operation: `${operation}:${table}`,
      });
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience methods
export const log = {
  debug: (msg: string, ctx?: LogContext) => logger.debug(msg, ctx),
  info: (msg: string, ctx?: LogContext) => logger.info(msg, ctx),
  warn: (msg: string, ctx?: LogContext) => logger.warn(msg, ctx),
  error: (msg: string, err?: unknown, ctx?: LogContext) => logger.error(msg, err, ctx),
  api: (service: string, op: string, success: boolean, duration?: number) =>
    logger.apiCall(service, op, success, duration),
  db: (op: string, table: string, success: boolean, err?: unknown) =>
    logger.dbOperation(op, table, success, err),
};
