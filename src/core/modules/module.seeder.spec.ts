import { Test, TestingModule } from '@nestjs/testing';
import { ModuleSeeder } from './module.seeder';
import { ModulesRepository } from './repositories';
import { ModuleLabelEnum, ModuleTypeEnum } from '../../common/enum';
import { ModuleEntity } from './entities';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

const buildExpectedIcon = (label: string): string =>
    label.toLowerCase().trim().replaceAll(/\s+/g, '-');

describe('ModuleSeeder', () => {
    let seeder: ModuleSeeder;
    let moduleRepository: jest.Mocked<ModulesRepository>;
    let logger: any;

    beforeEach(async () => {
        const mockLogger = {
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
        };
        const mockRepository = {
            find: jest.fn(),
            createMany: jest.fn(),
            delete: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ModuleSeeder,
                {
                    provide: ModulesRepository,
                    useValue: mockRepository,
                },
                {
                    provide: WINSTON_MODULE_PROVIDER,
                    useValue: mockLogger,
                },
            ],
        }).compile();

        seeder = module.get<ModuleSeeder>(ModuleSeeder);
        moduleRepository = module.get(ModulesRepository);
        logger = module.get(WINSTON_MODULE_PROVIDER);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('seed', () => {
        it('should delete all modules and recreate them when database is empty', async () => {
            moduleRepository.find.mockResolvedValue([]);
            moduleRepository.delete.mockResolvedValue({
                affected: 0,
                raw: [],
            } as any);
            moduleRepository.createMany.mockResolvedValue([]);

            await seeder.seed();

            expect(logger.info).toHaveBeenCalledWith('Seeding modules seed');
            expect(moduleRepository.find).toHaveBeenCalledWith({
                where: { deleted: false },
            });
            expect(moduleRepository.delete).toHaveBeenCalledWith({
                deleted: false,
            });
            expect(moduleRepository.createMany).toHaveBeenCalledTimes(1);

            const createdModules = moduleRepository.createMany.mock.calls[0][0];
            expect(createdModules).toHaveLength(9);
            expect(createdModules).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        label: ModuleLabelEnum.RENTAL_ANALYZER,
                        type: ModuleTypeEnum.MODULE,
                        color: '#DC6803',
                        icon: buildExpectedIcon(ModuleLabelEnum.RENTAL_ANALYZER),
                    }),
                    expect.objectContaining({
                        label: ModuleLabelEnum.FIX_FLIP_ANALYZER,
                        type: ModuleTypeEnum.MODULE,
                        color: '#A04FCD',
                        icon: buildExpectedIcon(ModuleLabelEnum.FIX_FLIP_ANALYZER),
                    }),
                    expect.objectContaining({
                        label: ModuleLabelEnum.REHAB_CALCULATOR,
                        type: ModuleTypeEnum.MODULE,
                        color: '#3F53B2',
                        icon: buildExpectedIcon(ModuleLabelEnum.REHAB_CALCULATOR),
                    }),
                    expect.objectContaining({
                        label: ModuleLabelEnum.CREATIVE_FINANCING_ANALYZER,
                        type: ModuleTypeEnum.MODULE,
                        color: '#EEB109',
                        icon: buildExpectedIcon(ModuleLabelEnum.CREATIVE_FINANCING_ANALYZER),
                    }),
                    expect.objectContaining({
                        label: ModuleLabelEnum.BRRRR_ANALYZER,
                        type: ModuleTypeEnum.MODULE,
                        color: '#2CBECA',
                        icon: buildExpectedIcon(ModuleLabelEnum.BRRRR_ANALYZER),
                    }),
                    expect.objectContaining({
                        label: ModuleLabelEnum.WHOLESALE_ANALYZER,
                        type: ModuleTypeEnum.MODULE,
                        color: '#36A756',
                        icon: buildExpectedIcon(ModuleLabelEnum.WHOLESALE_ANALYZER),
                    }),
                    expect.objectContaining({
                        label: ModuleLabelEnum.INVESTMENT_STRATEGY_ANALYZER,
                        type: ModuleTypeEnum.MODULE,
                        color: '#C01048',
                        icon: buildExpectedIcon(ModuleLabelEnum.INVESTMENT_STRATEGY_ANALYZER),
                    }),
                    expect.objectContaining({
                        label: ModuleLabelEnum.DTI_CALCULATOR,
                        type: ModuleTypeEnum.TOOLS,
                        color: '#80C95A',
                        icon: buildExpectedIcon(ModuleLabelEnum.DTI_CALCULATOR),
                    }),
                    expect.objectContaining({
                        label: ModuleLabelEnum.MORTGAGE_CALCULATOR,
                        type: ModuleTypeEnum.TOOLS,
                        color: '#71B780',
                        icon: buildExpectedIcon(ModuleLabelEnum.MORTGAGE_CALCULATOR),
                    }),
                ]),
            );

            expect(logger.info).toHaveBeenCalledWith('Module seed successfully ended');
        });

        it('should not delete or create modules when all 9 modules already exist', async () => {
            const existingModules = new Array(9).fill({});
            moduleRepository.find.mockResolvedValue(existingModules as any);

            await seeder.seed();

            expect(moduleRepository.delete).not.toHaveBeenCalled();
            expect(moduleRepository.createMany).not.toHaveBeenCalled();
        });

        it('should delete all and recreate when less than 9 modules exist', async () => {
            moduleRepository.find.mockResolvedValue(new Array(2).fill({}) as any);
            moduleRepository.delete.mockResolvedValue({
                affected: 2,
                raw: [],
            } as any);
            moduleRepository.createMany.mockResolvedValue([]);

            await seeder.seed();

            expect(moduleRepository.delete).toHaveBeenCalledWith({
                deleted: false,
            });
            expect(moduleRepository.createMany).toHaveBeenCalledTimes(1);

            const createdModules = moduleRepository.createMany.mock.calls[0][0];
            expect(createdModules).toHaveLength(9);
        });

        it('should delete all and recreate when exactly 8 modules exist', async () => {
            moduleRepository.find.mockResolvedValue(new Array(8).fill({}) as any);
            moduleRepository.delete.mockResolvedValue({
                affected: 8,
                raw: [],
            } as any);
            moduleRepository.createMany.mockResolvedValue([]);

            await seeder.seed();

            expect(moduleRepository.delete).toHaveBeenCalledWith({
                deleted: false,
            });
            const createdModules = moduleRepository.createMany.mock.calls[0][0];
            expect(createdModules).toHaveLength(9);
        });

        it('should create ModuleEntity instances with correct properties', async () => {
            moduleRepository.find.mockResolvedValue([]);
            moduleRepository.delete.mockResolvedValue({
                affected: 0,
                raw: [],
            } as any);
            moduleRepository.createMany.mockResolvedValue([]);

            await seeder.seed();

            const createdModules = moduleRepository.createMany.mock.calls[0][0];
            createdModules.forEach((m) => {
                expect(m).toBeInstanceOf(ModuleEntity);
                expect(m.label).toBeDefined();
                expect(m.type).toBeDefined();
                expect(m.icon).toBeDefined();
                expect(m.color).toBeDefined();
            });
        });

        it('should create 7 MODULE type and 2 TOOLS type entries', async () => {
            moduleRepository.find.mockResolvedValue([]);
            moduleRepository.delete.mockResolvedValue({
                affected: 0,
                raw: [],
            } as any);
            moduleRepository.createMany.mockResolvedValue([]);

            await seeder.seed();

            const createdModules = moduleRepository.createMany.mock.calls[0][0];
            expect(createdModules.filter((m) => m.type === ModuleTypeEnum.MODULE)).toHaveLength(7);
            expect(createdModules.filter((m) => m.type === ModuleTypeEnum.TOOLS)).toHaveLength(2);
        });

        it('should generate icons with no whitespace and no double hyphens', async () => {
            moduleRepository.find.mockResolvedValue([]);
            moduleRepository.delete.mockResolvedValue({
                affected: 0,
                raw: [],
            } as any);
            moduleRepository.createMany.mockResolvedValue([]);

            await seeder.seed();

            const createdModules = moduleRepository.createMany.mock.calls[0][0];
            createdModules.forEach((m) => {
                expect(m.icon).not.toMatch(/\s/);
                expect(m.icon).not.toMatch(/--+/);
            });
        });

        it('should log info at start and end of seeding', async () => {
            moduleRepository.find.mockResolvedValue([]);
            moduleRepository.delete.mockResolvedValue({
                affected: 0,
                raw: [],
            } as any);
            moduleRepository.createMany.mockResolvedValue([]);

            await seeder.seed();

            expect(logger.info).toHaveBeenCalledTimes(2);
            expect(logger.info).toHaveBeenNthCalledWith(1, 'Seeding modules seed');
            expect(logger.info).toHaveBeenNthCalledWith(2, 'Module seed successfully ended');
        });
    });

    describe('Service instantiation', () => {
        it('should be defined', () => {
            expect(seeder).toBeDefined();
        });

        it('should have logger dependency injected', () => {
            expect(seeder['logger']).toBeDefined();
        });

        it('should have moduleRepository dependency injected', () => {
            expect(seeder['moduleRepository']).toBeDefined();
        });
    });
});
