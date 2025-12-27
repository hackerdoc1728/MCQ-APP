// src/infra/logger.js
/* eslint-disable */
import winston from 'winston';

const NODE_ENV = process.env.NODE_ENV || 'development';

// Custom format to handle multiple args
const printfFormat = winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let finalMessage = message;

    // If additional metadata exists, append it
    if (meta && Object.keys(meta).length > 0) {
        finalMessage += ' ' + JSON.stringify(meta);
    }

    return `${timestamp} [${level.toUpperCase()}]: ${finalMessage}`;
});

export const logger = winston.createLogger({
    level: NODE_ENV === 'development' ? 'debug' : 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.splat(),        // handles printf-style %s %j etc
        printfFormat
    ),
    transports: [new winston.transports.Console()],
});
