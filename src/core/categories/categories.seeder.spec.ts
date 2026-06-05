import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { EnvConfigService } from '../../utils/services/config';
import { In } from 'typeorm';
import { CategoriesSeeder } from './categories.seeder';
import { CategoriesRepository } from './categories.repository';
import { CategoryEntity } from './entities/category.entity';

describe('CategoriesSeeder', () => {
    let seeder: CategoriesSeeder;
    let repository: jest.Mocked<CategoriesRepository>;
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
            gCFinance: 'Finances',
            gCREstate: 'Real Estate',
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CategoriesSeeder,
                {
                    provide: WINSTON_MODULE_PROVIDER,
                    useValue: mockLogger,
                },
                {
                    provide: CategoriesRepository,
                    useValue: mockRepository,
                },
                {
                    provide: EnvConfigService,
                    useValue: mockEnvConfigService,
                },
            ],
        }).compile();

        seeder = module.get<CategoriesSeeder>(CategoriesSeeder);
        repository = module.get(CategoriesRepository);
        logger = module.get(WINSTON_MODULE_PROVIDER);
        module.get(EnvConfigService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('seed', () => {
        it('should seed all guides categories when database is empty', async () => {
            repository.find.mockResolvedValue([]);
            repository.createMany.mockResolvedValue([]);

            await seeder.seed();

            expect(repository.find).toHaveBeenCalledWith({
                where: {
                    label: In(['Finances', 'Real Estate']),
                    deleted: false,
                },
            });

            expect(repository.createMany).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({ label: 'Finances' }),
                    expect.objectContaining({ label: 'Real Estate' }),
                ]),
            );

            expect(logger.info).toHaveBeenCalledWith(
                'Default guide categories seeded successfully.',
            );
        });

        it('should not seed guides categories that already exist', async () => {
            const data = new CategoryEntity();
            data.label = 'Finances';

            repository.find.mockResolvedValue([data]);

            await seeder.seed();

            expect(repository.createMany).toHaveBeenCalledWith(
                expect.arrayContaining([expect.objectContaining({ label: 'Real Estate' })]),
            );

            expect(repository.createMany).not.toHaveBeenCalledWith(
                expect.arrayContaining([expect.objectContaining({ label: 'admin' })]),
            );
        });

        it('should not seed anything when all guides categories already exist', async () => {
            const results = [{ label: 'Finances' }, { label: 'Real Estate' }].map((data) => {
                const result = new CategoryEntity();
                result.label = data.label;
                return result;
            });

            repository.find.mockResolvedValue(results);

            await seeder.seed();

            expect(repository.createMany).not.toHaveBeenCalled();
            expect(logger.info).toHaveBeenCalledWith(
                'All guide categories already exist, nothing to seed.',
            );
        });

        it('should filter out null/undefined guides categories from environment config', async () => {
            const mockEnvConfigServiceWithNulls = {
                gCFinance: 'Finances',
                gCREstate: null!,
            };

            const module: TestingModule = await Test.createTestingModule({
                providers: [
                    CategoriesSeeder,
                    {
                        provide: WINSTON_MODULE_PROVIDER,
                        useValue: logger,
                    },
                    {
                        provide: CategoriesRepository,
                        useValue: repository,
                    },
                    {
                        provide: EnvConfigService,
                        useValue: mockEnvConfigServiceWithNulls,
                    },
                ],
            }).compile();

            const seederWithNulls = module.get<CategoriesSeeder>(CategoriesSeeder);

            repository.find.mockResolvedValue([]);
            repository.createMany.mockResolvedValue([]);

            await seederWithNulls.seed();

            expect(repository.createMany).toHaveBeenCalledWith(
                expect.arrayContaining([expect.objectContaining({ label: 'Finances' })]),
            );

            const createdData = repository.createMany.mock.calls[0][0];
            expect(createdData).toHaveLength(1);
            expect(createdData.every((data) => data.label)).toBe(true);
        });

        it('should warn and return early when no valid guides categories are configured', async () => {
            const mockEnvConfigServiceEmpty = {
                gCFinance: null,
                gCREstate: null,
            };

            const module: TestingModule = await Test.createTestingModule({
                providers: [
                    CategoriesSeeder,
                    {
                        provide: WINSTON_MODULE_PROVIDER,
                        useValue: logger,
                    },
                    {
                        provide: CategoriesRepository,
                        useValue: repository,
                    },
                    {
                        provide: EnvConfigService,
                        useValue: mockEnvConfigServiceEmpty,
                    },
                ],
            }).compile();

            const seederEmpty = module.get<CategoriesSeeder>(CategoriesSeeder);

            await seederEmpty.seed();

            expect(logger.warn).toHaveBeenCalledWith('No guide categories to seed.');
            expect(repository.find).not.toHaveBeenCalled();
            expect(repository.createMany).not.toHaveBeenCalled();
        });

        it('should log error and rethrow when repository.createMany fails', async () => {
            const error = new Error('Database connection failed');
            repository.find.mockResolvedValue([]);
            repository.createMany.mockRejectedValue(error);

            await expect(seeder.seed()).rejects.toThrow('Database connection failed');

            expect(logger.error).toHaveBeenCalledWith('Error seeding guide categories:', error);
        });

        it('should create RoleEntity instances with correct labels', async () => {
            repository.find.mockResolvedValue([]);
            repository.createMany.mockResolvedValue([]);

            await seeder.seed();

            const createdRoles = repository.createMany.mock.calls[0][0];

            createdRoles.forEach((role) => {
                expect(role).toBeInstanceOf(CategoryEntity);
                expect(role.label).toBeTruthy();
            });
        });

        it('should query repository with In operator for all configured labels', async () => {
            repository.find.mockResolvedValue([]);
            repository.createMany.mockResolvedValue([]);

            await seeder.seed();

            expect(repository.find).toHaveBeenCalledWith({
                where: {
                    label: In(['Finances', 'Real Estate']),
                    deleted: false,
                },
            });
        });

        it('should only check for non-deleted guides categories', async () => {
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
