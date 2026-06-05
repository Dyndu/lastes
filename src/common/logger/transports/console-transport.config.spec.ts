import * as winston from 'winston';
import { consoleTransport } from './console-transport.config';

describe('consoleTransport', () => {
    it('should be defined', () => {
        expect(consoleTransport).toBeDefined();
    });

    it('should be an instance of winston.transports.Console', () => {
        expect(consoleTransport).toBeInstanceOf(winston.transports.Console);
    });
});
