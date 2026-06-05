import { Test, TestingModule } from '@nestjs/testing';
import { NewslettersModule } from './newsletters.module';
import { NewslettersController } from './newsletters.controller';
import { NewslettersService } from './services/newsletters.service';
import { PreNewslettersService } from './services/pre-newsletters.service';
import { NewslettersRepository } from './newsletters.repository';
import { NewsletterProcessor } from './services/newsletter.processor';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NewsletterEntity } from './entities/newsletter.entity';
import { Reflector } from '@nestjs/core';
import { EnvConfigService } from '../../utils/services/config';
import { ErrorHandlerService } from '../../common/response';
import { getQueueToken } from '@nestjs/bullmq';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('NewslettersModule', () => {
    let module: TestingModule;

    const mockRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };

    const mockErrorHandlerService = {
        forbidden: jest.fn((_message, userMessage) => {
            throw new Error(userMessage);
        }),
    };

    const mockNewslettersService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    };

    const mockPreNewslettersService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
    };

    const mockNewsletterProcessor = {
        process: jest.fn(),
    };

    const mockNotificationsService = {
        send: jest.fn(),
    };

    const mockUsersService = {
        findOne: jest.fn(),
    };

    const mockEnvConfigService = {
        sAdminRole: 'superadmin',
        adminRole: 'admin',
        userRole: 'user',
        supportRole: 'support',
    };

    beforeEach(async () => {
        module = await Test.createTestingModule({
            controllers: [NewslettersController],
            providers: [
                { provide: NewslettersRepository, useValue: mockRepository },
                { provide: NewslettersService, useValue: mockNewslettersService },
                { provide: PreNewslettersService, useValue: mockPreNewslettersService },
                { provide: NewsletterProcessor, useValue: mockNewsletterProcessor },
                { provide: ErrorHandlerService, useValue: mockErrorHandlerService },
                { provide: getRepositoryToken(NewsletterEntity), useValue: mockRepository },
                { provide: getQueueToken('newsletter'), useValue: { add: jest.fn() } },
                { provide: 'NotificationsService', useValue: mockNotificationsService },
                { provide: 'UsersService', useValue: mockUsersService },
                { provide: EnvConfigService, useValue: mockEnvConfigService },
                { provide: 'ErrorHandlerService', useValue: mockErrorHandlerService },
                {
                    provide: Reflector,
                    useValue: { get: jest.fn(), getAllAndOverride: jest.fn() },
                },
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
        it('should have NewslettersController defined', () => {
            expect(module.get<NewslettersController>(NewslettersController)).toBeDefined();
        });

        it('should create NewslettersController instance', () => {
            expect(module.get<NewslettersController>(NewslettersController)).toBeInstanceOf(
                NewslettersController,
            );
        });
    });

    describe('Providers', () => {
        it('should have NewslettersRepository defined', () => {
            expect(module.get<NewslettersRepository>(NewslettersRepository)).toBeDefined();
        });

        it('should have NewslettersService defined', () => {
            expect(module.get(NewslettersService)).toBeDefined();
        });

        it('should have PreNewslettersService defined', () => {
            expect(module.get(PreNewslettersService)).toBeDefined();
        });

        it('should have NewsletterProcessor defined', () => {
            expect(module.get(NewsletterProcessor)).toBeDefined();
        });
    });

    describe('Module Metadata', () => {
        it('should have controllers metadata', () => {
            const controllers = Reflect.getMetadata('controllers', NewslettersModule);
            expect(controllers).toBeDefined();
            expect(controllers).toContain(NewslettersController);
        });

        it('should have providers metadata', () => {
            const providers = Reflect.getMetadata('providers', NewslettersModule);
            expect(providers).toBeDefined();
            expect(providers).toContain(NewslettersRepository);
            expect(providers).toContain(NewslettersService);
            expect(providers).toContain(PreNewslettersService);
            expect(providers).toContain(NewsletterProcessor);
        });

        it('should have exports metadata', () => {
            const exports = Reflect.getMetadata('exports', NewslettersModule);
            expect(exports).toBeDefined();
            expect(exports).toContain(NewslettersRepository);
            expect(exports).toContain(NewslettersService);
            expect(exports).toContain(PreNewslettersService);
        });

        it('should have imports metadata', () => {
            const imports = Reflect.getMetadata('imports', NewslettersModule);
            expect(imports).toBeDefined();
            expect(imports.length).toBe(6);
        });

        it('should have correct number of controllers', () => {
            const controllers = Reflect.getMetadata('controllers', NewslettersModule);
            expect(controllers.length).toBe(1);
        });

        it('should have correct number of providers', () => {
            const providers = Reflect.getMetadata('providers', NewslettersModule);
            expect(providers.length).toBe(4);
        });

        it('should have correct number of exports', () => {
            const exports = Reflect.getMetadata('exports', NewslettersModule);
            expect(exports.length).toBe(3);
        });
    });

    describe('Exports Verification', () => {
        it('should export NewslettersRepository', () => {
            const exports = Reflect.getMetadata('exports', NewslettersModule);
            expect(exports).toContain(NewslettersRepository);
        });

        it('should export NewslettersService', () => {
            const exports = Reflect.getMetadata('exports', NewslettersModule);
            expect(exports).toContain(NewslettersService);
        });

        it('should export PreNewslettersService', () => {
            const exports = Reflect.getMetadata('exports', NewslettersModule);
            expect(exports).toContain(PreNewslettersService);
        });

        it('should not export NewsletterProcessor', () => {
            const exports = Reflect.getMetadata('exports', NewslettersModule);
            expect(exports).not.toContain(NewsletterProcessor);
        });

        it('should not export NewslettersController', () => {
            const exports = Reflect.getMetadata('exports', NewslettersModule);
            expect(exports).not.toContain(NewslettersController);
        });
    });

    describe('Module Encapsulation', () => {
        it('should keep NewsletterProcessor internal', () => {
            const providers = Reflect.getMetadata('providers', NewslettersModule);
            const exports = Reflect.getMetadata('exports', NewslettersModule);
            expect(providers).toContain(NewsletterProcessor);
            expect(exports).not.toContain(NewsletterProcessor);
        });

        it('should have 1 internal provider', () => {
            const providers = Reflect.getMetadata('providers', NewslettersModule);
            const exports = Reflect.getMetadata('exports', NewslettersModule);
            expect(providers.length - exports.length).toBe(1);
        });

        it('should have providers in correct order', () => {
            const providers = Reflect.getMetadata('providers', NewslettersModule);
            expect(providers[0]).toBe(NewslettersRepository);
            expect(providers[1]).toBe(NewslettersService);
            expect(providers[2]).toBe(PreNewslettersService);
            expect(providers[3]).toBe(NewsletterProcessor);
        });

        it('should have exports in correct order', () => {
            const exports = Reflect.getMetadata('exports', NewslettersModule);
            expect(exports[0]).toBe(NewslettersRepository);
            expect(exports[1]).toBe(NewslettersService);
            expect(exports[2]).toBe(PreNewslettersService);
        });
    });

    describe('Provider Instances', () => {
        it('should get NewslettersRepository instance', () => {
            expect(module.get<NewslettersRepository>(NewslettersRepository)).toBe(mockRepository);
        });

        it('should get NewslettersService instance', () => {
            expect(module.get(NewslettersService)).toBe(mockNewslettersService);
        });

        it('should get PreNewslettersService instance', () => {
            expect(module.get(PreNewslettersService)).toBe(mockPreNewslettersService);
        });

        it('should get NewsletterProcessor instance', () => {
            expect(module.get(NewsletterProcessor)).toBe(mockNewsletterProcessor);
        });
    });

    describe('Provider Uniqueness', () => {
        it('should return same NewslettersService instance (singleton)', () => {
            expect(module.get(NewslettersService)).toBe(module.get(NewslettersService));
        });

        it('should return same NewslettersRepository instance (singleton)', () => {
            expect(module.get(NewslettersRepository)).toBe(module.get(NewslettersRepository));
        });
    });

    describe('Module Compilation', () => {
        it('should compile without errors', () => {
            expect(module).toBeDefined();
            expect(module).toBeInstanceOf(TestingModule);
        });

        it('should initialize all providers', () => {
            expect(module.get(NewslettersRepository)).toBeDefined();
            expect(module.get(NewslettersService)).toBeDefined();
            expect(module.get(PreNewslettersService)).toBeDefined();
            expect(module.get(NewsletterProcessor)).toBeDefined();
        });

        it('should initialize all controllers', () => {
            expect(module.get(NewslettersController)).toBeDefined();
        });
    });

    describe('Entity Configuration', () => {
        it('should have NewsletterEntity token available', () => {
            const token = getRepositoryToken(NewsletterEntity);
            expect(token).toBeDefined();
        });

        it('should register NewsletterEntity token correctly', () => {
            const token = getRepositoryToken(NewsletterEntity);
            expect(token).toBe('NewsletterEntityRepository');
        });
    });
});
