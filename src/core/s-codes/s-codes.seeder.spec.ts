import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { SCodesSeeder } from './s-codes.seeder';
import { SCodesRepository } from './s-codes.repository';
import { SCodeEntity } from './entities/s-code.entity';
import { EnvConfigService } from '../../utils/services/config';
import { In } from 'typeorm';

describe('SCodesSeeder', () => {
    let seeder: SCodesSeeder;
    let repository: jest.Mocked<SCodesRepository>;
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
            sCodeOther: 'others',
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SCodesSeeder,
                {
                    provide: WINSTON_MODULE_PROVIDER,
                    useValue: mockLogger,
                },
                {
                    provide: SCodesRepository,
                    useValue: mockRepository,
                },
                {
                    provide: EnvConfigService,
                    useValue: mockEnvConfigService,
                },
            ],
        }).compile();

        seeder = module.get<SCodesSeeder>(SCodesSeeder);
        repository = module.get(SCodesRepository);
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

            expect(logger.info).toHaveBeenCalledWith('Seeding default support codes...');
        });

        it('should seed support code when database is empty', async () => {
            repository.find.mockResolvedValue([]);
            repository.createMany.mockResolvedValue([]);

            await seeder.seed();

            expect(repository.find).toHaveBeenCalledWith({
                where: {
                    label: In(['others']),
                    deleted: false,
                },
            });

            expect(repository.createMany).toHaveBeenCalledWith(
                expect.arrayContaining([expect.objectContaining({ label: 'others' })]),
            );

            expect(logger.info).toHaveBeenCalledWith('Default support codes seeded successfully.');
        });

        it('should not seed support code that already exists', async () => {
            const existingCode = new SCodeEntity();
            existingCode.label = 'others';

            repository.find.mockResolvedValue([existingCode]);

            await seeder.seed();

            expect(repository.createMany).not.toHaveBeenCalled();
            expect(logger.info).toHaveBeenCalledWith(
                'All support codes already exist, nothing to seed.',
            );
        });

        it('should filter out null support code from environment config', async () => {
            const mockEnvConfigServiceWithNull = {
                sCodeOther: null,
            };

            const module: TestingModule = await Test.createTestingModule({
                providers: [
                    SCodesSeeder,
                    {
                        provide: WINSTON_MODULE_PROVIDER,
                        useValue: logger,
                    },
                    {
                        provide: SCodesRepository,
                        useValue: repository,
                    },
                    {
                        provide: EnvConfigService,
                        useValue: mockEnvConfigServiceWithNull,
                    },
                ],
            }).compile();

            const seederWithNull = module.get<SCodesSeeder>(SCodesSeeder);

            await seederWithNull.seed();

            expect(logger.warn).toHaveBeenCalledWith(
                'No valid support codes to seed. Check your environment variables.',
            );
            expect(repository.find).not.toHaveBeenCalled();
            expect(repository.createMany).not.toHaveBeenCalled();
        });

        it('should filter out undefined support code from environment config', async () => {
            const mockEnvConfigServiceWithUndefined = {
                sCodeOther: undefined,
            };

            const module: TestingModule = await Test.createTestingModule({
                providers: [
                    SCodesSeeder,
                    {
                        provide: WINSTON_MODULE_PROVIDER,
                        useValue: logger,
                    },
                    {
                        provide: SCodesRepository,
                        useValue: repository,
                    },
                    {
                        provide: EnvConfigService,
                        useValue: mockEnvConfigServiceWithUndefined,
                    },
                ],
            }).compile();

            const seederWithUndefined = module.get<SCodesSeeder>(SCodesSeeder);

            await seederWithUndefined.seed();

            expect(logger.warn).toHaveBeenCalledWith(
                'No valid support codes to seed. Check your environment variables.',
            );
            expect(repository.find).not.toHaveBeenCalled();
            expect(repository.createMany).not.toHaveBeenCalled();
        });

        it('should warn and return early when no valid support codes are configured', async () => {
            const mockEnvConfigServiceEmpty = {
                sCodeOther: null,
            };

            const module: TestingModule = await Test.createTestingModule({
                providers: [
                    SCodesSeeder,
                    {
                        provide: WINSTON_MODULE_PROVIDER,
                        useValue: logger,
                    },
                    {
                        provide: SCodesRepository,
                        useValue: repository,
                    },
                    {
                        provide: EnvConfigService,
                        useValue: mockEnvConfigServiceEmpty,
                    },
                ],
            }).compile();

            const seederEmpty = module.get<SCodesSeeder>(SCodesSeeder);

            await seederEmpty.seed();

            expect(logger.warn).toHaveBeenCalledWith(
                'No valid support codes to seed. Check your environment variables.',
            );
            expect(repository.find).not.toHaveBeenCalled();
            expect(repository.createMany).not.toHaveBeenCalled();
        });

        it('should log error and rethrow when repository.createMany fails', async () => {
            const error = new Error('Database connection failed');
            repository.find.mockResolvedValue([]);
            repository.createMany.mockRejectedValue(error);

            await expect(seeder.seed()).rejects.toThrow('Database connection failed');

            expect(logger.error).toHaveBeenCalledWith('Error seeding support codes:', error);
        });

        it('should create SCodeEntity instances with correct labels', async () => {
            repository.find.mockResolvedValue([]);
            repository.createMany.mockResolvedValue([]);

            await seeder.seed();

            const createdCodes = repository.createMany.mock.calls[0][0];

            createdCodes.forEach((code) => {
                expect(code).toBeInstanceOf(SCodeEntity);
                expect(code.label).toBeTruthy();
                expect(code.label).toBe('others');
            });
        });

        it('should query repository with In operator for configured label', async () => {
            repository.find.mockResolvedValue([]);
            repository.createMany.mockResolvedValue([]);

            await seeder.seed();

            expect(repository.find).toHaveBeenCalledWith({
                where: {
                    label: In(['others']),
                    deleted: false,
                },
            });
        });

        it('should only check for non-deleted support codes', async () => {
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

        it('should create exactly one support code entities', async () => {
            repository.find.mockResolvedValue([]);
            repository.createMany.mockResolvedValue([]);

            await seeder.seed();

            const createdCodes = repository.createMany.mock.calls[0][0];
            expect(createdCodes).toHaveLength(1);
        });

        it('should handle empty string as falsy value in filter', async () => {
            const mockEnvConfigServiceEmptyString = {
                sCodeOther: '',
            };

            const module: TestingModule = await Test.createTestingModule({
                providers: [
                    SCodesSeeder,
                    {
                        provide: WINSTON_MODULE_PROVIDER,
                        useValue: logger,
                    },
                    {
                        provide: SCodesRepository,
                        useValue: repository,
                    },
                    {
                        provide: EnvConfigService,
                        useValue: mockEnvConfigServiceEmptyString,
                    },
                ],
            }).compile();

            const seederEmptyString = module.get<SCodesSeeder>(SCodesSeeder);

            await seederEmptyString.seed();

            expect(logger.warn).toHaveBeenCalledWith(
                'No valid support codes to seed. Check your environment variables.',
            );
            expect(repository.find).not.toHaveBeenCalled();
            expect(repository.createMany).not.toHaveBeenCalled();
        });

        it('should successfully seed with valid sCodeOther value', async () => {
            const mockEnvConfigServiceValid = {
                sCodeOther: 'custom_other',
            };

            const module: TestingModule = await Test.createTestingModule({
                providers: [
                    SCodesSeeder,
                    {
                        provide: WINSTON_MODULE_PROVIDER,
                        useValue: logger,
                    },
                    {
                        provide: SCodesRepository,
                        useValue: repository,
                    },
                    {
                        provide: EnvConfigService,
                        useValue: mockEnvConfigServiceValid,
                    },
                ],
            }).compile();

            const seederCustom = module.get<SCodesSeeder>(SCodesSeeder);
            repository.find.mockResolvedValue([]);
            repository.createMany.mockResolvedValue([]);

            await seederCustom.seed();

            expect(repository.find).toHaveBeenCalledWith({
                where: {
                    label: In(['custom_other']),
                    deleted: false,
                },
            });

            expect(repository.createMany).toHaveBeenCalledWith(
                expect.arrayContaining([expect.objectContaining({ label: 'custom_other' })]),
            );
        });

        it('should not call createMany when all codes exist but log appropriate message', async () => {
            const existingCode = new SCodeEntity();
            existingCode.label = 'others';

            repository.find.mockResolvedValue([existingCode]);

            await seeder.seed();

            expect(repository.createMany).not.toHaveBeenCalled();
            expect(logger.info).toHaveBeenCalledWith(
                'All support codes already exist, nothing to seed.',
            );
            expect(logger.info).toHaveBeenCalledTimes(2); // Initial log + final log
        });

        it('should handle repository.find returning empty array and proceed with seeding', async () => {
            repository.find.mockResolvedValue([]);
            repository.createMany.mockResolvedValue([]);

            await seeder.seed();

            expect(repository.find).toHaveBeenCalled();
            expect(repository.createMany).toHaveBeenCalled();
            expect(logger.info).toHaveBeenCalledWith('Default support codes seeded successfully.');
        });
    });
});
