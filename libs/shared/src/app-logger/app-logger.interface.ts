import * as winston from 'winston';

export interface LogMetadata extends winston.Logform.TransformableInfo {
  timestamp: string;
  service: string;
}
