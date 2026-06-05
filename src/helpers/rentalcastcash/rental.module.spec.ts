import { HttpModule } from '@nestjs/axios';
import { RentalModule } from './rental.module';
import { RentalService } from './rental.service';

describe('RentalModule', () => {
    describe('Module Metadata', () => {
        it('should have correct imports metadata', () => {
            const imports = Reflect.getMetadata('imports', RentalModule);
            expect(imports).toBeDefined();
            expect(imports).toContain(HttpModule);
        });

        it('should have correct providers metadata', () => {
            const providers = Reflect.getMetadata('providers', RentalModule);
            expect(providers).toBeDefined();
            expect(providers).toContain(RentalService);
        });

        it('should have correct exports metadata', () => {
            const exports = Reflect.getMetadata('exports', RentalModule);
            expect(exports).toBeDefined();
            expect(exports).toContain(RentalService);
        });

        it('should have exactly one provider', () => {
            const providers = Reflect.getMetadata('providers', RentalModule);
            expect(providers.length).toBe(1);
        });

        it('should have exactly one export', () => {
            const exports = Reflect.getMetadata('exports', RentalModule);
            expect(exports.length).toBe(1);
        });

        it('should export the same provider it declares', () => {
            const providers = Reflect.getMetadata('providers', RentalModule);
            const exports = Reflect.getMetadata('exports', RentalModule);
            exports.forEach((exp: any) => expect(providers).toContain(exp));
        });
    });

    describe('Module Structure', () => {
        it('should not be a global module', () => {
            const isGlobal = Reflect.getMetadata('__module:global__', RentalModule);
            expect(isGlobal).toBeFalsy();
        });

        it('should have no controllers', () => {
            const controllers = Reflect.getMetadata('controllers', RentalModule);
            expect(controllers == null || controllers.length === 0).toBe(true);
        });

        it('should import HttpModule to provide HttpService', () => {
            const imports = Reflect.getMetadata('imports', RentalModule);
            expect(imports).toContain(HttpModule);
        });
    });

    describe('Public API', () => {
        it('should expose RentalService to other modules', () => {
            const exports = Reflect.getMetadata('exports', RentalModule);
            expect(exports).toContain(RentalService);
        });

        it('should not expose more than RentalService', () => {
            const exports = Reflect.getMetadata('exports', RentalModule);
            expect(exports.length).toBe(1);
            expect(exports[0]).toBe(RentalService);
        });
    });
});
