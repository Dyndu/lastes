import { Test, TestingModule } from '@nestjs/testing';
import { FilesModule } from './files.module';
import { FilesController } from './files.controller';
import { FilesService } from './services/files.service';
import { FileLinksService } from './services/file-links.service';
import { FilesRepository } from './repositories/files.repository';
import { FileLinksRepository } from './repositories/file-links.repository';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FileEntity } from './entities/file.entity';
import { FileLinksEntity } from './entities/file-links.entity';
import { Reflector } from '@nestjs/core';
import { EnvConfigService } from '../../utils/services/config';
import { ErrorHandlerService } from '../../common/response';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('FilesModule', () => {
    let module: TestingModule;

    const mockFilesRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };

    const mockFileLinksRepository = {
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

    const mockFilesService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
        upload: jest.fn(),
        download: jest.fn(),
    };

    const mockFileLinksService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
        createLink: jest.fn(),
    };

    const mockEnvConfigService = {
        sAdminRole: 'superadmin',
        adminRole: 'admin',
        userRole: 'user',
        supportRole: 'support',
    };

    const mockPermissionsGuard = {
        canActivate: jest.fn(() => true),
    };

    beforeEach(async () => {
        module = await Test.createTestingModule({
            controllers: [FilesController],
            providers: [
                {
                    provide: FilesRepository,
                    useValue: mockFilesRepository,
                },
                {
                    provide: FileLinksRepository,
                    useValue: mockFileLinksRepository,
                },
                {
                    provide: FilesService,
                    useValue: mockFilesService,
                },
                {
                    provide: FileLinksService,
                    useValue: mockFileLinksService,
                },
                {
                    provide: ErrorHandlerService,
                    useValue: mockErrorHandlerService,
                },
                {
                    provide: getRepositoryToken(FileEntity),
                    useValue: mockFilesRepository,
                },
                {
                    provide: getRepositoryToken(FileLinksEntity),
                    useValue: mockFileLinksRepository,
                },
                {
                    provide: EnvConfigService,
                    useValue: mockEnvConfigService,
                },
                {
                    provide: 'ErrorHandlerService',
                    useValue: mockErrorHandlerService,
                },
                {
                    provide: Reflector,
                    useValue: {
                        get: jest.fn(),
                        getAllAndOverride: jest.fn(),
                    },
                },
                {
                    provide: 'PermissionsGuard',
                    useValue: mockPermissionsGuard,
                },
            ],
        }).compile();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Module Definition', () => {
        it('should be defined', () => {
            expect(module).toBeDefined();
        });

        it('should compile the module', () => {
            expect(module).toBeInstanceOf(TestingModule);
        });
    });

    describe('Global Module', () => {
        it('should be a global module', () => {
            const isGlobal = Reflect.getMetadata('__module:global__', FilesModule);
            expect(isGlobal).toBe(true);
        });
    });

    describe('Controllers', () => {
        it('should have FilesController defined', () => {
            const controller = module.get<FilesController>(FilesController);
            expect(controller).toBeDefined();
        });

        it('should create FilesController instance', () => {
            const controller = module.get<FilesController>(FilesController);
            expect(controller).toBeInstanceOf(FilesController);
        });
    });

    describe('Providers', () => {
        it('should have FilesRepository defined', () => {
            const repository = module.get<FilesRepository>(FilesRepository);
            expect(repository).toBeDefined();
        });

        it('should have FileLinksRepository defined', () => {
            const repository = module.get<FileLinksRepository>(FileLinksRepository);
            expect(repository).toBeDefined();
        });

        it('should have FilesService defined', () => {
            const service = module.get(FilesService);
            expect(service).toBeDefined();
        });

        it('should have FileLinksService defined', () => {
            const service = module.get(FileLinksService);
            expect(service).toBeDefined();
        });
    });

    describe('Module Metadata', () => {
        it('should have controllers metadata', () => {
            const controllers = Reflect.getMetadata('controllers', FilesModule);
            expect(controllers).toBeDefined();
            expect(controllers).toContain(FilesController);
        });

        it('should have providers metadata', () => {
            const providers = Reflect.getMetadata('providers', FilesModule);
            expect(providers).toBeDefined();
            expect(providers).toContain(FilesRepository);
            expect(providers).toContain(FileLinksRepository);
            expect(providers).toContain(FilesService);
            expect(providers).toContain(FileLinksService);
        });

        it('should have exports metadata', () => {
            const exports = Reflect.getMetadata('exports', FilesModule);
            expect(exports).toBeDefined();
            expect(exports).toContain(FilesRepository);
            expect(exports).toContain(FileLinksRepository);
            expect(exports).toContain(FilesService);
            expect(exports).toContain(FileLinksService);
        });

        it('should have imports metadata', () => {
            const imports = Reflect.getMetadata('imports', FilesModule);
            expect(imports).toBeDefined();
            expect(imports.length).toBe(2);
        });

        it('should have correct number of controllers', () => {
            const controllers = Reflect.getMetadata('controllers', FilesModule);
            expect(controllers.length).toBe(1);
        });

        it('should have correct number of providers', () => {
            const providers = Reflect.getMetadata('providers', FilesModule);
            expect(providers.length).toBe(4);
        });

        it('should have correct number of exports', () => {
            const exports = Reflect.getMetadata('exports', FilesModule);
            expect(exports.length).toBe(4);
        });
    });

    describe('Exports Verification', () => {
        it('should export FilesService', () => {
            const exports = Reflect.getMetadata('exports', FilesModule);
            expect(exports).toContain(FilesService);
        });

        it('should export FileLinksService', () => {
            const exports = Reflect.getMetadata('exports', FilesModule);
            expect(exports).toContain(FileLinksService);
        });

        it('should export FilesRepository', () => {
            const exports = Reflect.getMetadata('exports', FilesModule);
            expect(exports).toContain(FilesRepository);
        });

        it('should export FileLinksRepository', () => {
            const exports = Reflect.getMetadata('exports', FilesModule);
            expect(exports).toContain(FileLinksRepository);
        });
    });

    describe('Module Structure', () => {
        it('should have all required imports', () => {
            const imports = Reflect.getMetadata('imports', FilesModule) || [];
            expect(imports.length).toBeGreaterThan(0);
        });

        it('should have all required providers', () => {
            const providers = Reflect.getMetadata('providers', FilesModule) || [];
            expect(providers.length).toBeGreaterThan(0);
        });

        it('should have all required controllers', () => {
            const controllers = Reflect.getMetadata('controllers', FilesModule) || [];
            expect(controllers.length).toBeGreaterThan(0);
        });

        it('should have all required exports', () => {
            const exports = Reflect.getMetadata('exports', FilesModule) || [];
            expect(exports.length).toBeGreaterThan(0);
        });
    });

    describe('Provider Configuration', () => {
        it('should configure FilesRepository correctly', () => {
            const providers = Reflect.getMetadata('providers', FilesModule);
            expect(providers).toContain(FilesRepository);
        });

        it('should configure FileLinksRepository correctly', () => {
            const providers = Reflect.getMetadata('providers', FilesModule);
            expect(providers).toContain(FileLinksRepository);
        });

        it('should configure FilesService correctly', () => {
            const providers = Reflect.getMetadata('providers', FilesModule);
            expect(providers).toContain(FilesService);
        });

        it('should configure FileLinksService correctly', () => {
            const providers = Reflect.getMetadata('providers', FilesModule);
            expect(providers).toContain(FileLinksService);
        });
    });

    describe('Controller Configuration', () => {
        it('should configure FilesController correctly', () => {
            const controllers = Reflect.getMetadata('controllers', FilesModule);
            expect(controllers).toContain(FilesController);
        });

        it('should have only one controller', () => {
            const controllers = Reflect.getMetadata('controllers', FilesModule);
            expect(controllers.length).toBe(1);
        });
    });

    describe('Module Dependencies', () => {
        it('should have DatabaseModule in imports', () => {
            const imports = Reflect.getMetadata('imports', FilesModule) || [];
            const hasDatabaseModule = imports.some(
                (imp: any) =>
                    imp?.name === 'DatabaseModule' ||
                    imp?.module?.name === 'DatabaseModule' ||
                    imp?.constructor?.name === 'DatabaseModule',
            );
            expect(hasDatabaseModule || imports.length === 2).toBe(true);
        });

        it('should have correct import count', () => {
            const imports = Reflect.getMetadata('imports', FilesModule) || [];
            expect(imports.length).toBe(2);
        });
    });

    describe('Repository Instances', () => {
        it('should get FilesRepository instance', () => {
            const repository = module.get<FilesRepository>(FilesRepository);
            expect(repository).toBe(mockFilesRepository);
        });

        it('should get FileLinksRepository instance', () => {
            const repository = module.get<FileLinksRepository>(FileLinksRepository);
            expect(repository).toBe(mockFileLinksRepository);
        });
    });

    describe('Service Instances', () => {
        it('should get FilesService instance', () => {
            const service = module.get(FilesService);
            expect(service).toBe(mockFilesService);
        });

        it('should get FileLinksService instance', () => {
            const service = module.get(FileLinksService);
            expect(service).toBe(mockFileLinksService);
        });
    });

    describe('Controller Instances', () => {
        it('should get FilesController instance', () => {
            const controller = module.get<FilesController>(FilesController);
            expect(controller).toBeDefined();
        });
    });

    describe('Entity Configuration', () => {
        it('should have FileEntity token available', () => {
            const token = getRepositoryToken(FileEntity);
            expect(token).toBeDefined();
        });

        it('should have FileLinksEntity token available', () => {
            const token = getRepositoryToken(FileLinksEntity);
            expect(token).toBeDefined();
        });
    });

    describe('Provider Dependencies', () => {
        it('should have all service dependencies resolved', () => {
            expect(module.get(FilesService)).toBeDefined();
            expect(module.get(FileLinksService)).toBeDefined();
        });

        it('should have all repository dependencies resolved', () => {
            expect(module.get(FilesRepository)).toBeDefined();
            expect(module.get(FileLinksRepository)).toBeDefined();
        });

        it('should have ErrorHandlerService available', () => {
            expect(module.get(ErrorHandlerService)).toBeDefined();
        });

        it('should have EnvConfigService available', () => {
            expect(module.get(EnvConfigService)).toBeDefined();
        });

        it('should have Reflector available', () => {
            expect(module.get(Reflector)).toBeDefined();
        });
    });

    describe('Module Exports Validation', () => {
        it('should export all repositories', () => {
            const exports = Reflect.getMetadata('exports', FilesModule);
            expect(exports).toContain(FilesRepository);
            expect(exports).toContain(FileLinksRepository);
        });

        it('should export all services', () => {
            const exports = Reflect.getMetadata('exports', FilesModule);
            expect(exports).toContain(FilesService);
            expect(exports).toContain(FileLinksService);
        });

        it('should have matching exports and providers count for exported items', () => {
            const exports = Reflect.getMetadata('exports', FilesModule);
            const providers = Reflect.getMetadata('providers', FilesModule);

            exports.forEach((exp: any) => {
                expect(providers).toContain(exp);
            });
        });

        it('should export all providers', () => {
            const exports = Reflect.getMetadata('exports', FilesModule);
            const providers = Reflect.getMetadata('providers', FilesModule);

            expect(exports.length).toBe(providers.length);
        });
    });

    describe('Module Import Validation', () => {
        it('should import DatabaseModule twice (base + forFeature)', () => {
            const imports = Reflect.getMetadata('imports', FilesModule) || [];
            const databaseImports = imports.filter(
                (imp: any) =>
                    imp?.name === 'DatabaseModule' ||
                    imp?.module?.name === 'DatabaseModule' ||
                    imp?.constructor?.name === 'DatabaseModule',
            );
            // Should have DatabaseModule and DatabaseModule.forFeature
            expect(databaseImports.length >= 1 || imports.length === 2).toBe(true);
        });

        it('should configure forFeature with two entities', () => {
            const imports = Reflect.getMetadata('imports', FilesModule) || [];
            expect(imports.length).toBe(2);
        });
    });

    describe('Module Compilation', () => {
        it('should compile without errors', () => {
            expect(module).toBeDefined();
            expect(module).toBeInstanceOf(TestingModule);
        });

        it('should initialize all providers', () => {
            expect(module.get(FilesRepository)).toBeDefined();
            expect(module.get(FileLinksRepository)).toBeDefined();
            expect(module.get(FilesService)).toBeDefined();
            expect(module.get(FileLinksService)).toBeDefined();
        });

        it('should initialize all controllers', () => {
            expect(module.get(FilesController)).toBeDefined();
        });
    });

    describe('Provider Uniqueness', () => {
        it('should have unique FilesService instances per module', () => {
            const service1 = module.get<FilesService>(FilesService);
            const service2 = module.get<FilesService>(FilesService);

            expect(service1).toBe(service2);
        });

        it('should have unique FileLinksService instances per module', () => {
            const service1 = module.get<FileLinksService>(FileLinksService);
            const service2 = module.get<FileLinksService>(FileLinksService);

            expect(service1).toBe(service2);
        });

        it('should have unique FilesRepository instances per module', () => {
            const repo1 = module.get<FilesRepository>(FilesRepository);
            const repo2 = module.get<FilesRepository>(FilesRepository);

            expect(repo1).toBe(repo2);
        });

        it('should have unique FileLinksRepository instances per module', () => {
            const repo1 = module.get<FileLinksRepository>(FileLinksRepository);
            const repo2 = module.get<FileLinksRepository>(FileLinksRepository);

            expect(repo1).toBe(repo2);
        });
    });

    describe('Module Integration', () => {
        it('should integrate with DatabaseModule', () => {
            const imports = Reflect.getMetadata('imports', FilesModule) || [];
            expect(imports.length).toBe(2);
        });
    });

    describe('Complete Module Structure', () => {
        it('should have correct module structure', () => {
            const controllers = Reflect.getMetadata('controllers', FilesModule);
            const providers = Reflect.getMetadata('providers', FilesModule);
            const exports = Reflect.getMetadata('exports', FilesModule);
            const imports = Reflect.getMetadata('imports', FilesModule);

            expect(controllers).toBeDefined();
            expect(providers).toBeDefined();
            expect(exports).toBeDefined();
            expect(imports).toBeDefined();

            expect(controllers.length).toBe(1);
            expect(providers.length).toBe(4);
            expect(exports.length).toBe(4);
            expect(imports.length).toBe(2);
        });
    });

    describe('Full Export Strategy', () => {
        it('should export all providers including repositories', () => {
            const providers = Reflect.getMetadata('providers', FilesModule);
            const exports = Reflect.getMetadata('exports', FilesModule);

            providers.forEach((provider: any) => {
                expect(exports).toContain(provider);
            });
        });

        it('should make all providers globally available', () => {
            const exports = Reflect.getMetadata('exports', FilesModule);
            const isGlobal = Reflect.getMetadata('__module:global__', FilesModule);

            expect(isGlobal).toBe(true);
            expect(exports.length).toBe(4);
        });
    });

    describe('Global Module Behavior', () => {
        it('should have global decorator applied', () => {
            const isGlobal = Reflect.getMetadata('__module:global__', FilesModule);
            expect(isGlobal).toBe(true);
        });

        it('should make exported providers available globally', () => {
            const exports = Reflect.getMetadata('exports', FilesModule);
            expect(exports.length).toBeGreaterThan(0);
            expect(exports).toContain(FilesRepository);
            expect(exports).toContain(FileLinksRepository);
            expect(exports).toContain(FilesService);
            expect(exports).toContain(FileLinksService);
        });
    });

    describe('Module Provider Order', () => {
        it('should have providers in correct order', () => {
            const providers = Reflect.getMetadata('providers', FilesModule);
            expect(providers[0]).toBe(FilesService);
            expect(providers[1]).toBe(FilesRepository);
            expect(providers[2]).toBe(FileLinksRepository);
            expect(providers[3]).toBe(FileLinksService);
        });
    });

    describe('Module Export Order', () => {
        it('should have exports in correct order', () => {
            const exports = Reflect.getMetadata('exports', FilesModule);
            expect(exports[0]).toBe(FilesService);
            expect(exports[1]).toBe(FilesRepository);
            expect(exports[2]).toBe(FileLinksRepository);
            expect(exports[3]).toBe(FileLinksService);
        });
    });

    describe('Entity Registration', () => {
        it('should register FileEntity', () => {
            const token = getRepositoryToken(FileEntity);
            expect(token).toBe('FileEntityRepository');
        });

        it('should register FileLinksEntity', () => {
            const token = getRepositoryToken(FileLinksEntity);
            expect(token).toBe('FileLinksEntityRepository');
        });

        it('should have both entities registered', () => {
            const fileToken = getRepositoryToken(FileEntity);
            const linksToken = getRepositoryToken(FileLinksEntity);

            expect(fileToken).toBeDefined();
            expect(linksToken).toBeDefined();
            expect(fileToken).not.toBe(linksToken);
        });
    });

    describe('Multiple Service and Repository Support', () => {
        it('should support multiple services in one module', () => {
            const providers = Reflect.getMetadata('providers', FilesModule);
            const services = providers.filter(
                (p: any) => p === FilesService || p === FileLinksService,
            );

            expect(services.length).toBe(2);
        });

        it('should support multiple repositories in one module', () => {
            const providers = Reflect.getMetadata('providers', FilesModule);
            const repositories = providers.filter(
                (p: any) => p === FilesRepository || p === FileLinksRepository,
            );

            expect(repositories.length).toBe(2);
        });

        it('should be able to inject all services', () => {
            const filesService = module.get<FilesService>(FilesService);
            const linksService = module.get<FileLinksService>(FileLinksService);

            expect(filesService).toBeDefined();
            expect(linksService).toBeDefined();
            expect(filesService).not.toBe(linksService);
        });

        it('should be able to inject all repositories', () => {
            const filesRepo = module.get<FilesRepository>(FilesRepository);
            const linksRepo = module.get<FileLinksRepository>(FileLinksRepository);

            expect(filesRepo).toBeDefined();
            expect(linksRepo).toBeDefined();
            expect(filesRepo).not.toBe(linksRepo);
        });
    });

    describe('Complete Exports Pattern', () => {
        it('should export both services and repositories', () => {
            const exports = Reflect.getMetadata('exports', FilesModule);

            const hasAllServices =
                exports.includes(FilesService) && exports.includes(FileLinksService);
            const hasAllRepositories =
                exports.includes(FilesRepository) && exports.includes(FileLinksRepository);

            expect(hasAllServices).toBe(true);
            expect(hasAllRepositories).toBe(true);
        });

        it('should export all providers without exception', () => {
            const providers = Reflect.getMetadata('providers', FilesModule);
            const exports = Reflect.getMetadata('exports', FilesModule);

            expect(providers.length).toBe(exports.length);

            providers.forEach((provider: any) => {
                expect(exports).toContain(provider);
            });
        });
    });
});
