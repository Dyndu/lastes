import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { RolesSeeder } from './roles.seeder';
import { RolesRepository } from './roles.repository';
import { RoleEntity } from './entities/role.entity';
import { EnvConfigService } from '../../utils/services/config';
import { In } from 'typeorm';

describe('RolesSeeder', () => {
    let seeder: RolesSeeder;
    let repository: jest.Mocked<RolesRepository>;
    let logger: jest.Mocked<any>;

    beforeEach(async () => {
        const mockLogger = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };

        const mockRepository = {
            find: jest.fn(),
            createMany: jest.fn(),
        };

        const mockEnvConfigService = {
            sAdminRole: 'super_admin',
            adminRole: 'admin',
            userRole: 'user',
            supportRole: 'support',
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RolesSeeder,
                {
                    provide: WINSTON_MODULE_PROVIDER,
                    useValue: mockLogger,
                },
                {
                    provide: RolesRepository,
                    useValue: mockRepository,
                },
                {
                    provide: EnvConfigService,
                    useValue: mockEnvConfigService,
                },
            ],
        }).compile();

        seeder = module.get<RolesSeeder>(RolesSeeder);
        repository = module.get(RolesRepository);
        logger = module.get(WINSTON_MODULE_PROVIDER);
        module.get(EnvConfigService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('seed', () => {
        it('should log info at the beginning of seeding process', async () => {
            repository.find.mockResolvedValue([]);
            repository.createMany.mockResolvedValue([]);

            await seeder.seed();

            expect(logger.info).toHaveBeenCalledWith('Seeding default roles...');
        });

        it('should seed all roles when database is empty', async () => {
            repository.find.mockResolvedValue([]);
            repository.createMany.mockResolvedValue([]);

            await seeder.seed();

            expect(repository.find).toHaveBeenCalledWith({
                where: {
                    label: In(['super_admin', 'admin', 'user', 'support']),
                    deleted: false,
                },
            });

            expect(repository.createMany).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({ label: 'super_admin' }),
                    expect.objectContaining({ label: 'admin' }),
                    expect.objectContaining({ label: 'user' }),
                    expect.objectContaining({ label: 'support' }),
                ]),
            );

            expect(logger.info).toHaveBeenCalledWith('Default roles seeded successfully.');
        });

        it('should not seed roles that already exist', async () => {
            const existingRole = new RoleEntity();
            existingRole.label = 'admin';

            repository.find.mockResolvedValue([existingRole]);

            await seeder.seed();

            expect(repository.createMany).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({ label: 'super_admin' }),
                    expect.objectContaining({ label: 'user' }),
                    expect.objectContaining({ label: 'support' }),
                ]),
            );

            expect(repository.createMany).not.toHaveBeenCalledWith(
                expect.arrayContaining([expect.objectContaining({ label: 'admin' })]),
            );
        });

        it('should not seed anything when all roles already exist', async () => {
            const existingRoles = [
                { label: 'super_admin' },
                { label: 'admin' },
                { label: 'user' },
                { label: 'support' },
            ].map((data) => {
                const role = new RoleEntity();
                role.label = data.label;
                return role;
            });

            repository.find.mockResolvedValue(existingRoles);

            await seeder.seed();

            expect(repository.createMany).not.toHaveBeenCalled();
            expect(logger.info).toHaveBeenCalledWith('All roles already exist, nothing to seed.');
        });

        it('should filter out null/undefined roles from environment config', async () => {
            const mockEnvConfigServiceWithNulls = {
                sAdminRole: 'super_admin',
                adminRole: 'admin',
                userRole: null,
                supportRole: undefined,
            };

            const module: TestingModule = await Test.createTestingModule({
                providers: [
                    RolesSeeder,
                    {
                        provide: WINSTON_MODULE_PROVIDER,
                        useValue: logger,
                    },
                    {
                        provide: RolesRepository,
                        useValue: repository,
                    },
                    {
                        provide: EnvConfigService,
                        useValue: mockEnvConfigServiceWithNulls,
                    },
                ],
            }).compile();

            const seederWithNulls = module.get<RolesSeeder>(RolesSeeder);

            repository.find.mockResolvedValue([]);
            repository.createMany.mockResolvedValue([]);

            await seederWithNulls.seed();

            expect(repository.createMany).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({ label: 'super_admin' }),
                    expect.objectContaining({ label: 'admin' }),
                ]),
            );

            const createdRoles = repository.createMany.mock.calls[0][0];
            expect(createdRoles).toHaveLength(2);
            expect(createdRoles.every((role) => role.label)).toBe(true);
        });

        it('should warn and return early when no valid roles are configured', async () => {
            const mockEnvConfigServiceEmpty = {
                sAdminRole: null,
                adminRole: null,
                userRole: null,
                supportRole: null,
            };

            const module: TestingModule = await Test.createTestingModule({
                providers: [
                    RolesSeeder,
                    {
                        provide: WINSTON_MODULE_PROVIDER,
                        useValue: logger,
                    },
                    {
                        provide: RolesRepository,
                        useValue: repository,
                    },
                    {
                        provide: EnvConfigService,
                        useValue: mockEnvConfigServiceEmpty,
                    },
                ],
            }).compile();

            const seederEmpty = module.get<RolesSeeder>(RolesSeeder);

            await seederEmpty.seed();

            expect(logger.warn).toHaveBeenCalledWith(
                'No valid roles to seed. Check your environment variables.',
            );
            expect(repository.find).not.toHaveBeenCalled();
            expect(repository.createMany).not.toHaveBeenCalled();
        });

        it('should log error and rethrow when repository.createMany fails', async () => {
            const error = new Error('Database connection failed');
            repository.find.mockResolvedValue([]);
            repository.createMany.mockRejectedValue(error);

            await expect(seeder.seed()).rejects.toThrow('Database connection failed');

            expect(logger.error).toHaveBeenCalledWith('Error seeding roles:', error);
        });

        it('should create RoleEntity instances with correct labels', async () => {
            repository.find.mockResolvedValue([]);
            repository.createMany.mockResolvedValue([]);

            await seeder.seed();

            const createdRoles = repository.createMany.mock.calls[0][0];

            createdRoles.forEach((role) => {
                expect(role).toBeInstanceOf(RoleEntity);
                expect(role.label).toBeTruthy();
            });
        });

        it('should query repository with In operator for all configured labels', async () => {
            repository.find.mockResolvedValue([]);
            repository.createMany.mockResolvedValue([]);

            await seeder.seed();

            expect(repository.find).toHaveBeenCalledWith({
                where: {
                    label: In(['super_admin', 'admin', 'user', 'support']),
                    deleted: false,
                },
            });
        });

        it('should only check for non-deleted roles', async () => {
            repository.find.mockResolvedValue([]);
            repository.createMany.mockResolvedValue([]);

            await seeder.seed();

            expect(repository.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        deleted: false,
                    }),
                }),
            );
        });
    });
});
