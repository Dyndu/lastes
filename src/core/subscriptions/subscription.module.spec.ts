import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionModule } from './subscription.module';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { SubscriptionRepository } from './subscription.repository';
import { SubscriptionSeeder } from './subscription.seeder';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SubscriptionEntity } from './entities/subscription.entity';
import { Reflector } from '@nestjs/core';
import { EnvConfigService } from '../../utils/services/config';
import { ErrorHandlerService } from '../../common/response';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('SubscriptionModule', () => {
    let module: TestingModule;

    const mockSubscriptionRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };

    const mockSubscriptionService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    };

    const mockSubscriptionSeeder = {
        seed: jest.fn(),
    };

    const mockEnvConfigService = {
        monthlySPrice: 3200,
        yearlySPrice: 32000,
    };

    const mockErrorHandlerService = {
        notFound: jest.fn((_message, userMessage) => {
            throw new Error(userMessage);
        }),
    };

    beforeEach(async () => {
        module = await Test.createTestingModule({
            controllers: [SubscriptionController],
            providers: [
                { provide: SubscriptionRepository, useValue: mockSubscriptionRepository },
                { provide: SubscriptionService, useValue: mockSubscriptionService },
                { provide: SubscriptionSeeder, useValue: mockSubscriptionSeeder },
                { provide: ErrorHandlerService, useValue: mockErrorHandlerService },
                { provide: EnvConfigService, useValue: mockEnvConfigService },
                {
                    provide: getRepositoryToken(SubscriptionEntity),
                    useValue: mockSubscriptionRepository,
                },
                { provide: Reflector, useValue: { get: jest.fn(), getAllAndOverride: jest.fn() } },
            ],
        }).compile();
    });

    afterEach(() => jest.clearAllMocks());

    describe('Module Definition', () => {
        it('should be defined', () => {
            expect(module).toBeDefined();
        });

        it('should compile the module', () => {
            expect(module).toBeInstanceOf(TestingModule);
        });
    });

    describe('Controllers', () => {
        it('should have SubscriptionController defined', () => {
            const controller = module.get<SubscriptionController>(SubscriptionController);
            expect(controller).toBeDefined();
        });

        it('should create SubscriptionController instance', () => {
            const controller = module.get<SubscriptionController>(SubscriptionController);
            expect(controller).toBeInstanceOf(SubscriptionController);
        });
    });

    describe('Providers', () => {
        it('should have SubscriptionService defined', () => {
            expect(module.get(SubscriptionService)).toBeDefined();
        });

        it('should have SubscriptionRepository defined', () => {
            expect(module.get(SubscriptionRepository)).toBeDefined();
        });

        it('should have SubscriptionSeeder defined', () => {
            expect(module.get(SubscriptionSeeder)).toBeDefined();
        });
    });

    describe('Module Metadata', () => {
        it('should have controllers metadata', () => {
            const controllers = Reflect.getMetadata('controllers', SubscriptionModule);
            expect(controllers).toBeDefined();
            expect(controllers).toContain(SubscriptionController);
        });

        it('should have providers metadata', () => {
            const providers = Reflect.getMetadata('providers', SubscriptionModule);
            expect(providers).toBeDefined();
            expect(providers).toContain(SubscriptionService);
            expect(providers).toContain(SubscriptionRepository);
            expect(providers).toContain(SubscriptionSeeder);
        });

        it('should have exports metadata', () => {
            const exports = Reflect.getMetadata('exports', SubscriptionModule);
            expect(exports).toBeDefined();
            expect(exports).toContain(SubscriptionService);
        });

        it('should have imports metadata', () => {
            const imports = Reflect.getMetadata('imports', SubscriptionModule);
            expect(imports).toBeDefined();
            expect(imports.length).toBe(2);
        });

        it('should have correct number of controllers', () => {
            const controllers = Reflect.getMetadata('controllers', SubscriptionModule);
            expect(controllers.length).toBe(1);
        });

        it('should have correct number of providers', () => {
            const providers = Reflect.getMetadata('providers', SubscriptionModule);
            expect(providers.length).toBe(3);
        });

        it('should have correct number of exports', () => {
            const exports = Reflect.getMetadata('exports', SubscriptionModule);
            expect(exports.length).toBe(1);
        });
    });

    describe('Exports Verification', () => {
        it('should export SubscriptionService', () => {
            const exports = Reflect.getMetadata('exports', SubscriptionModule);
            expect(exports).toContain(SubscriptionService);
        });

        it('should NOT export SubscriptionRepository', () => {
            const exports = Reflect.getMetadata('exports', SubscriptionModule);
            expect(exports).not.toContain(SubscriptionRepository);
        });

        it('should NOT export SubscriptionSeeder', () => {
            const exports = Reflect.getMetadata('exports', SubscriptionModule);
            expect(exports).not.toContain(SubscriptionSeeder);
        });

        it('should NOT export SubscriptionController', () => {
            const exports = Reflect.getMetadata('exports', SubscriptionModule);
            expect(exports).not.toContain(SubscriptionController);
        });

        it('should export exactly one provider', () => {
            const exports = Reflect.getMetadata('exports', SubscriptionModule);
            expect(exports.length).toBe(1);
        });
    });

    describe('Module Provider Order', () => {
        it('should have providers in correct order: Service, Repository, Seeder', () => {
            const providers = Reflect.getMetadata('providers', SubscriptionModule);
            expect(providers[0]).toBe(SubscriptionService);
            expect(providers[1]).toBe(SubscriptionRepository);
            expect(providers[2]).toBe(SubscriptionSeeder);
        });
    });

    describe('Module Export Order', () => {
        it('should have SubscriptionService as the only export', () => {
            const exports = Reflect.getMetadata('exports', SubscriptionModule);
            expect(exports[0]).toBe(SubscriptionService);
        });
    });

    describe('Provider Instances', () => {
        it('should get SubscriptionService instance', () => {
            expect(module.get(SubscriptionService)).toBe(mockSubscriptionService);
        });

        it('should get SubscriptionRepository instance', () => {
            expect(module.get(SubscriptionRepository)).toBe(mockSubscriptionRepository);
        });

        it('should get SubscriptionSeeder instance', () => {
            expect(module.get(SubscriptionSeeder)).toBe(mockSubscriptionSeeder);
        });
    });

    describe('Internal vs External Providers', () => {
        it('should have 2 internal (non-exported) providers', () => {
            const providers = Reflect.getMetadata('providers', SubscriptionModule);
            const exports = Reflect.getMetadata('exports', SubscriptionModule);
            const internalProviders = providers.filter((p: any) => !exports.includes(p));
            expect(internalProviders.length).toBe(2);
        });

        it('should keep SubscriptionRepository internal', () => {
            const providers = Reflect.getMetadata('providers', SubscriptionModule);
            const exports = Reflect.getMetadata('exports', SubscriptionModule);
            const internalProviders = providers.filter((p: any) => !exports.includes(p));
            expect(internalProviders).toContain(SubscriptionRepository);
        });

        it('should keep SubscriptionSeeder internal', () => {
            const providers = Reflect.getMetadata('providers', SubscriptionModule);
            const exports = Reflect.getMetadata('exports', SubscriptionModule);
            const internalProviders = providers.filter((p: any) => !exports.includes(p));
            expect(internalProviders).toContain(SubscriptionSeeder);
        });

        it('should export 1 out of 3 providers', () => {
            const providers = Reflect.getMetadata('providers', SubscriptionModule);
            const exports = Reflect.getMetadata('exports', SubscriptionModule);
            expect(providers.length).toBe(3);
            expect(exports.length).toBe(1);
        });
    });

    describe('Module Encapsulation', () => {
        it('should expose only SubscriptionService to other modules', () => {
            const exports = Reflect.getMetadata('exports', SubscriptionModule);
            expect(exports).toEqual([SubscriptionService]);
        });

        it('should keep 2 providers internal', () => {
            const providers = Reflect.getMetadata('providers', SubscriptionModule);
            const exports = Reflect.getMetadata('exports', SubscriptionModule);
            expect(providers.length - exports.length).toBe(2);
        });
    });

    describe('Provider Uniqueness', () => {
        it('should return the same service instance on multiple gets', () => {
            expect(module.get(SubscriptionService)).toBe(module.get(SubscriptionService));
        });

        it('should return the same repository instance on multiple gets', () => {
            expect(module.get(SubscriptionRepository)).toBe(module.get(SubscriptionRepository));
        });
    });

    describe('Entity Configuration', () => {
        it('should have SubscriptionEntity token available', () => {
            const token = getRepositoryToken(SubscriptionEntity);
            expect(token).toBeDefined();
        });

        it('should register SubscriptionEntity token correctly', () => {
            const token = getRepositoryToken(SubscriptionEntity);
            expect(token).toBe('SubscriptionEntityRepository');
        });
    });

    describe('Complete Module Structure', () => {
        it('should have correct module structure', () => {
            const controllers = Reflect.getMetadata('controllers', SubscriptionModule);
            const providers = Reflect.getMetadata('providers', SubscriptionModule);
            const exports = Reflect.getMetadata('exports', SubscriptionModule);
            const imports = Reflect.getMetadata('imports', SubscriptionModule);

            expect(controllers.length).toBe(1);
            expect(providers.length).toBe(3);
            expect(exports.length).toBe(1);
            expect(imports.length).toBe(2);
        });
    });

    describe('Module Compilation', () => {
        it('should compile without errors', () => {
            expect(module).toBeDefined();
            expect(module).toBeInstanceOf(TestingModule);
        });

        it('should initialize all providers', () => {
            expect(module.get(SubscriptionService)).toBeDefined();
            expect(module.get(SubscriptionRepository)).toBeDefined();
            expect(module.get(SubscriptionSeeder)).toBeDefined();
        });

        it('should initialize the controller', () => {
            expect(module.get(SubscriptionController)).toBeDefined();
        });
    });
});
