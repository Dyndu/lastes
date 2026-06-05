import * as indexExports from './index';
import {
    CustomValidationPipe,
    ErrorHandlerService,
    ResponseInterceptor,
    ResponseModule,
} from './index';

describe('Index barrel exports', () => {
    const expectedExports = [
        ['CustomValidationPipe', CustomValidationPipe],
        ['ErrorHandlerService', ErrorHandlerService],
        ['ResponseInterceptor', ResponseInterceptor],
        ['ResponseModule', ResponseModule],
    ] as const;

    it.each(expectedExports)('should re-export response %s correctly', (name, originalEnum) => {
        expect(indexExports[name]).toBe(originalEnum);
    });

    it('should export all expected modules', () => {
        const exportNames = expectedExports.map(([name]) => name);
        exportNames.forEach((name) => {
            expect(indexExports).toHaveProperty(name);
        });
    });
});
