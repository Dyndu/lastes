import { Test, TestingModule } from '@nestjs/testing';
import { LoggerModule } from './logger.module';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

describe('LoggerModule', () => {
    let module: TestingModule;
    let logger: Logger;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [LoggerModule],
        }).compile();
        logger = module.get<Logger>(WINSTON_MODULE_PROVIDER);
    });

    it('should compile the module', () => {
        expect(module).toBeDefined();
    });

    it('should provide the Winston logger', () => {
        expect(logger).toBeDefined();
        expect(typeof logger.info).toBe('function');
        expect(typeof logger.error).toBe('function');
        expect(typeof logger.debug).toBe('function');
    });

    it('should have transports configured', () => {
        expect(logger.transports.length).toBeGreaterThan(0);
    });
});
