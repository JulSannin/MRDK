import winston from 'winston';
import fs from 'fs';
import path from 'path';

let loggerInstance = null;

export function initLogger(level = 'info') {
    if (loggerInstance) {
        return loggerInstance;
    }

    const logDir = path.resolve('logs');
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }

    loggerInstance = winston.createLogger({
        level,
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
        ),
        transports: [
            new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
            new winston.transports.File({ filename: 'logs/combined.log' }),
        ],
    });

    if (process.env.NODE_ENV !== 'production') {
        loggerInstance.add(new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            ),
        }));
    }

    return loggerInstance;
}

export function getLogger() {
    if (!loggerInstance) {
        return initLogger();
    }
    return loggerInstance;
}
