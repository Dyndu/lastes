import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { RolesRepository } from './roles.repository';
import { RolesSeeder } from './roles.seeder';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { RoleEntity } from './entities/role.entity';
import { EnvConfigService } from '../../utils/services/config';

describe('RolesModule', () => {
    let module: TestingModule;
    let rolesRepository: RolesRepository;
    let rolesSeeder: RolesSeeder;

    const mockEntityManager = {
        save: jest.fn(),
        find: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
    };

    const mockRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        createMany: jest.fn(),
    };

    const mockLogger = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    };

    const mockEnvConfigService = {
        sAdminRole: 'SUPER_ADMIN',
        adminRole: 'ADMIN',
        userRole: 'USER',
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        module = await Test.createTestingModule({
            providers: [
                RolesRepository,
                RolesSeeder,
                {
                    provide: getRepositoryToken(RoleEntity),
                    useValue: mockRepository,
                },
                {
                    provide: EntityManager,
                    useValue: mockEntityManager,
                },
                {
                    provide: WINSTON_MODULE_PROVIDER,
                    useValue: mockLogger,
                },
                {
                    provide: EnvConfigService,
                    useValue: mockEnvConfigService,
                },
            ],
        }).compile();

        rolesRepository = module.get<RolesRepository>(RolesRepository);
        rolesSeeder = module.get<RolesSeeder>(RolesSeeder);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Module Definition', () => {
        it('should be defined', () => {
            expect(module).toBeDefined();
        });

        it('should compile successfully', () => {
            expect(module).toBeInstanceOf(TestingModule);
        });
    });

    describe('Providers', () => {
        it('should have RolesRepository as a provider', () => {
            expect(rolesRepository).toBeDefined();
            expect(rolesRepository).toBeInstanceOf(RolesRepository);
        });

        it('should have RolesSeeder as a provider', () => {
            expect(rolesSeeder).toBeDefined();
            expect(rolesSeeder).toBeInstanceOf(RolesSeeder);
        });

        it('should provide EntityManager', () => {
            const entityManager = module.get<EntityManager>(EntityManager);
            expect(entityManager).toBeDefined();
            expect(entityManager).toBe(mockEntityManager);
        });

        it('should provide RoleEntity repository token', () => {
            const repository = module.get(getRepositoryToken(RoleEntity));
            expect(repository).toBeDefined();
            expect(repository).toBe(mockRepository);
        });

        it('should provide WINSTON_MODULE_PROVIDER', () => {
            const logger = module.get(WINSTON_MODULE_PROVIDER);
            expect(logger).toBeDefined();
            expect(logger).toBe(mockLogger);
        });

        it('should provide EnvConfigService', () => {
            const envConfig = module.get<EnvConfigService>(EnvConfigService);
            expect(envConfig).toBeDefined();
            expect(envConfig).toBe(mockEnvConfigService);
        });
    });

    describe('Dependency Injection', () => {
        it('should successfully instantiate RolesRepository with dependencies', () => {
            expect(rolesRepository).toBeDefined();
            expect(rolesRepository).toBeInstanceOf(RolesRepository);
            expect(typeof rolesRepository.find).toBe('function');
            expect(typeof rolesRepository.findOne).toBe('function');
        });

        it('should successfully instantiate RolesSeeder with dependencies', () => {
            expect(rolesSeeder).toBeDefined();
            expect(rolesSeeder).toBeInstanceOf(RolesSeeder);
            expect(typeof rolesSeeder.seed).toBe('function');
        });

        it('should have seed method on RolesSeeder', () => {
            expect(rolesSeeder.seed).toBeDefined();
            expect(typeof rolesSeeder.seed).toBe('function');
        });

        it('should allow RolesSeeder to call seed without errors from missing dependencies', async () => {
            mockRepository.find.mockResolvedValue([]);
            mockRepository.createMany.mockResolvedValue([]);

            await expect(rolesSeeder.seed()).resolves.not.toThrow();

            expect(mockLogger.info).toHaveBeenCalled();
        });
    });

    describe('Module Exports', () => {
        it('should be able to get RolesRepository for export', () => {
            const repository = module.get<RolesRepository>(RolesRepository);
            expect(repository).toBeDefined();
            expect(repository).toBeInstanceOf(RolesRepository);
        });
    });

    describe('Integration', () => {
        it('should allow RolesSeeder to interact with RolesRepository', async () => {
            mockRepository.find.mockResolvedValue([]);
            mockRepository.createMany.mockResolvedValue([]);

            await rolesSeeder.seed();

            expect(mockRepository.find).toHaveBeenCalled();
            expect(mockLogger.info).toHaveBeenCalled();
        });

        it('should have all dependencies properly wired', () => {
            expect(module.get<RolesRepository>(RolesRepository)).toBeDefined();
            expect(module.get<RolesSeeder>(RolesSeeder)).toBeDefined();
            expect(module.get(getRepositoryToken(RoleEntity))).toBeDefined();
            expect(module.get<EntityManager>(EntityManager)).toBeDefined();
            expect(module.get(WINSTON_MODULE_PROVIDER)).toBeDefined();
            expect(module.get<EnvConfigService>(EnvConfigService)).toBeDefined();
        });

        it('should allow RolesRepository methods to be called', () => {
            expect(() => rolesRepository.find).not.toThrow();
            expect(() => rolesRepository.findOne).not.toThrow();
        });
    });
});
