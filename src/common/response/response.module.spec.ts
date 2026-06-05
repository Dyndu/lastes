import { Test, TestingModule } from '@nestjs/testing';
import { ResponseModule } from './response.module';
import { ErrorHandlerService } from './errorHandler.service';

describe('ResponseModule', () => {
    let module: TestingModule;
    let errorHandlingService: ErrorHandlerService;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ResponseModule],
        }).compile();

        errorHandlingService = module.get<ErrorHandlerService>(ErrorHandlerService);
    });

    it('should compile the module', () => {
        expect(module).toBeDefined();
    });

    it('should provide ErrorHandlingService', () => {
        expect(errorHandlingService).toBeDefined();
        expect(typeof errorHandlingService.notFound).toBe('function');
        expect(typeof errorHandlingService.unauthorized).toBe('function');
        expect(typeof errorHandlingService.unprocessable).toBe('function');
    });
});
