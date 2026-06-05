import { Global, Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { loggerTransports } from './transports/transports';
import * as winston from 'winston';

const colorizer = winston.format.colorize();

@Global()
@Module({
    imports: [
        WinstonModule.forRoot({
            transports: loggerTransports,
            level: 'debug',
            format: winston.format.combine(
                winston.format.errors({ stack: true }),
                winston.format.label({ label: '[LOGGER]' }),
                winston.format.timestamp(),
                winston.format.printf(
                    ({
                        label,
                        level,
                        message,
                        context,
                        timestamp,
                        name,
                    }: {
                        label: string;
                        level: string;
                        message: string;
                        context?: string;
                        timestamp: string;
                        name?: string;
                    }): string => {
                        return colorizer.colorize(
                            level,
                            `${label} ${timestamp} [${context || 'UnknownContext'}] [${name}] ${level}: ${message}`,
                        );
                    },
                ),
            ),
        }),
    ],
    exports: [WinstonModule],
})
export class LoggerModule {}
