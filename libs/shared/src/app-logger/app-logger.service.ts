import { Injectable, LoggerService, Scope } from '@nestjs/common';
import * as path from 'path';
import * as winston from 'winston';
import { LogMetadata } from './app-logger.interface';
import { logLevels } from './log-levels';

@Injectable({ scope: Scope.TRANSIENT })
export class AppLoggerService implements LoggerService {
  private readonly logger: winston.Logger;

  constructor() {
    const LOG_DIR_PATH = path.join(this.discoverServicePath(), 'logs');

    this.logger = winston.createLogger({
      level: logLevels.INFO,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
      defaultMeta: { service: 'App' },
      transports: [
        new winston.transports.File({
          filename: path.join(LOG_DIR_PATH, `${logLevels.ERROR}.log`),
          level: logLevels.ERROR,
        }),
        new winston.transports.File({
          filename: path.join(LOG_DIR_PATH, `${logLevels.WARN}.log`),
          level: logLevels.WARN,
        }),
        new winston.transports.File({
          filename: path.join(LOG_DIR_PATH, `${logLevels.INFO}.log`),
          level: logLevels.INFO,
        }),
      ],
    });

    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.printf(
              ({ level, message, timestamp, service }: LogMetadata) =>
                `${timestamp}   ${level.toUpperCase()} [${service}] ${message}`,
            ),
            winston.format.colorize({ all: true }),
          ),
        }),
      );
    }
  }

  private discoverServicePath(): string {
    const [rootDir, servicePathFromRoot] = path
      .resolve(__dirname)
      .split('dist');

    return `${rootDir.slice(0, rootDir.length - 1)}${servicePathFromRoot}`;
  }

  setContext(context: string = 'App') {
    this.logger.defaultMeta = { service: context };
  }

  log(message: string) {
    this.logger.info(message);
  }
  error(message: string) {
    this.logger.error(message);
  }
  warn(message: string) {
    this.logger.warn(message);
  }
}
