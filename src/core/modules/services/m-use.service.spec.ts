import { Test, TestingModule } from '@nestjs/testing';
import { MUseService } from './m-use.service';
import { ModulesService } from './modules.service';
import { ModuleEntity, MUseEntity } from '../entities';
import { MRelationDto } from '../dto';
import { ModuleMethodEnum } from '../../../common/enum';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('MUseService', () => {
    let service: MUseService;

    const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    };

    const mockErrorHandler = {
        notFound: jest.fn(),
        badRequest: jest.fn(),
    };

    const mockMUseRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        createMany: jest.fn(),
        save: jest.fn(),
    };

    const mockPreModuleService = {
        splitByMethod: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MUseService,
                {
                    provide: ModulesService,
                    useValue: {
                        logger: mockLogger,
                        errorHandler: mockErrorHandler,
                        mUseRepository: mockMUseRepository,
                        preModuleService: mockPreModuleService,
                    },
                },
            ],
        }).compile();

        service = module.get<MUseService>(MUseService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('buildMUseEntity', () => {
        it('should build a MUseEntity with provided required fields', () => {
            const module = { id: 'module-1' } as ModuleEntity;
            const required = {
                label: 'Test Label',
                icon: 'test-icon',
                module,
            };

            const result = service.buildMUseEntity(required);

            expect(result).toBeInstanceOf(MUseEntity);
            expect(result.label).toBe('Test Label');
            expect(result.icon).toBe('test-icon');
            expect(result.module).toBe(module);
        });
    });

    describe('retrieveMUses', () => {
        it('should retrieve MUses successfully when all ids exist', async () => {
            const mId = 'module-1';
            const ids = ['use-1', 'use-2', 'use-3'];
            const mockUses = [
                { id: 'use-1', label: 'Use 1' },
                { id: 'use-2', label: 'Use 2' },
                { id: 'use-3', label: 'Use 3' },
            ] as MUseEntity[];

            mockMUseRepository.find.mockResolvedValue(mockUses);

            const result = await service.retrieveMUses(ids, mId);

            expect(mockLogger.info).toHaveBeenCalledWith(
                `Retrieve a module (id: ${mId} uses with ids: ${ids.join(', ')}`,
            );
            expect(mockMUseRepository.find).toHaveBeenCalledWith({
                where: {
                    deleted: false,
                    module: { id: mId },
                    id: expect.any(Object),
                },
            });
            expect(result).toEqual(mockUses);
        });

        it('should filter duplicate ids before retrieving', async () => {
            const mId = 'module-1';
            const ids = ['use-1', 'use-2', 'use-1', 'use-2']; // Duplicates
            const mockUses = [
                { id: 'use-1', label: 'Use 1' },
                { id: 'use-2', label: 'Use 2' },
            ] as MUseEntity[];

            mockMUseRepository.find.mockResolvedValue(mockUses);

            const result = await service.retrieveMUses(ids, mId);

            expect(mockLogger.info).toHaveBeenCalledWith(
                `Retrieve a module (id: ${mId} uses with ids: use-1, use-2`,
            );
            expect(result).toEqual(mockUses);
        });

        it('should throw notFound error when some uses are not found', async () => {
            const mId = 'module-1';
            const ids = ['use-1', 'use-2', 'use-3'];
            const mockUses = [{ id: 'use-1', label: 'Use 1' }] as MUseEntity[];

            mockMUseRepository.find.mockResolvedValue(mockUses);

            await service.retrieveMUses(ids, mId);

            expect(mockErrorHandler.notFound).toHaveBeenCalledWith(
                `Some module uses aren't found`,
                `Uses not found`,
            );
        });
    });

    describe('updateMUseDetails', () => {
        it('should return message when no updates provided', async () => {
            const mUse = { id: 'use-1' } as MUseEntity;

            const result = await service.updateMUseDetails(mUse, undefined);

            expect(result).toEqual({
                message: 'No updates provided for module mUses',
            });
            expect(mockMUseRepository.update).not.toHaveBeenCalled();
        });

        it('should return message when updates object is empty', async () => {
            const mUse = { id: 'use-1' } as MUseEntity;

            const result = await service.updateMUseDetails(mUse, {});

            expect(result).toEqual({
                message: 'No updates provided for module mUses',
            });
            expect(mockMUseRepository.update).not.toHaveBeenCalled();
        });

        it('should update label when provided', async () => {
            const mUse = { id: 'use-1' } as MUseEntity;
            const updates = { label: '  Updated Label  ' };
            const updateResult = { affected: 1 };

            mockMUseRepository.update.mockResolvedValue(updateResult);

            const result = await service.updateMUseDetails(mUse, updates);

            expect(mockMUseRepository.update).toHaveBeenCalledWith(
                { id: 'use-1' },
                { label: 'Updated Label' },
            );
            expect(result).toEqual(updateResult);
        });

        it('should update icon when provided', async () => {
            const mUse = { id: 'use-1' } as MUseEntity;
            const updates = { icon: '  updated-icon  ' };
            const updateResult = { affected: 1 };

            mockMUseRepository.update.mockResolvedValue(updateResult);

            const result = await service.updateMUseDetails(mUse, updates);

            expect(mockMUseRepository.update).toHaveBeenCalledWith(
                { id: 'use-1' },
                { icon: 'updated-icon' },
            );
            expect(result).toEqual(updateResult);
        });

        it('should update module when provided', async () => {
            const mUse = { id: 'use-1' } as MUseEntity;
            const newModule = { id: 'module-2' } as ModuleEntity;
            const updates = { module: newModule };
            const updateResult = { affected: 1 };

            mockMUseRepository.update.mockResolvedValue(updateResult);

            const result = await service.updateMUseDetails(mUse, updates);

            expect(mockMUseRepository.update).toHaveBeenCalledWith(
                { id: 'use-1' },
                { module: newModule },
            );
            expect(result).toEqual(updateResult);
        });

        it('should update multiple fields when provided', async () => {
            const mUse = { id: 'use-1' } as MUseEntity;
            const newModule = { id: 'module-2' } as ModuleEntity;
            const updates = {
                label: '  New Label  ',
                icon: '  new-icon  ',
                module: newModule,
            };
            const updateResult = { affected: 1 };

            mockMUseRepository.update.mockResolvedValue(updateResult);

            const result = await service.updateMUseDetails(mUse, updates);

            expect(mockMUseRepository.update).toHaveBeenCalledWith(
                { id: 'use-1' },
                {
                    label: 'New Label',
                    icon: 'new-icon',
                    module: newModule,
                },
            );
            expect(result).toEqual(updateResult);
        });

        it('should not include empty string fields in update payload', async () => {
            const mUse = { id: 'use-1' } as MUseEntity;
            const updates = {
                label: '   ',
                icon: '',
            };
            const updateResult = { affected: 1 };

            mockMUseRepository.update.mockResolvedValue(updateResult);

            const result = await service.updateMUseDetails(mUse, updates);

            expect(mockMUseRepository.update).toHaveBeenCalledWith({ id: 'use-1' }, {});
            expect(result).toEqual(updateResult);
        });
    });

    describe('createUses', () => {
        it('should return early when items array is empty', async () => {
            const module = { id: 'module-1' } as ModuleEntity;

            await service.createUses(module, []);

            expect(mockMUseRepository.find).not.toHaveBeenCalled();
            expect(mockMUseRepository.createMany).not.toHaveBeenCalled();
        });

        it('should create new uses when no duplicates exist', async () => {
            const module = { id: 'module-1' } as ModuleEntity;
            const items = [
                { label: 'Use 1', icon: 'icon-1' },
                { label: 'Use 2', icon: 'icon-2' },
            ] as MRelationDto[];

            mockMUseRepository.find.mockResolvedValue([]);

            await service.createUses(module, items);

            expect(mockMUseRepository.find).toHaveBeenCalledWith({
                where: { module: { id: 'module-1' } },
            });
            expect(mockMUseRepository.createMany).toHaveBeenCalledWith([
                expect.objectContaining({
                    label: 'Use 1',
                    icon: 'icon-1',
                    module,
                }),
                expect.objectContaining({
                    label: 'Use 2',
                    icon: 'icon-2',
                    module,
                }),
            ]);
        });

        it('should filter out existing uses (case-insensitive)', async () => {
            const module = { id: 'module-1' } as ModuleEntity;
            const items = [
                { label: 'Use 1', icon: 'icon-1' },
                { label: '  USE 2  ', icon: 'icon-2' },
                { label: 'Use 3', icon: 'icon-3' },
            ] as MRelationDto[];

            const existingUses = [{ label: 'use 1', icon: 'old-icon-1' }] as MUseEntity[];

            mockMUseRepository.find.mockResolvedValue(existingUses);

            await service.createUses(module, items);

            expect(mockMUseRepository.createMany).toHaveBeenCalledWith([
                expect.objectContaining({
                    label: 'USE 2',
                    icon: 'icon-2',
                    module,
                }),
                expect.objectContaining({
                    label: 'Use 3',
                    icon: 'icon-3',
                    module,
                }),
            ]);
        });

        it('should filter out items without label', async () => {
            const module = { id: 'module-1' } as ModuleEntity;
            const items = [
                { label: 'Use 1', icon: 'icon-1' },
                { icon: 'icon-2' } as MRelationDto,
                { label: '', icon: 'icon-3' },
                { label: '   ', icon: 'icon-4' },
            ] as MRelationDto[];

            mockMUseRepository.find.mockResolvedValue([]);

            await service.createUses(module, items);

            expect(mockMUseRepository.createMany).toHaveBeenCalledWith([
                expect.objectContaining({
                    label: 'Use 1',
                    icon: 'icon-1',
                    module,
                }),
            ]);
        });

        it('should not create anything when all items are duplicates', async () => {
            const module = { id: 'module-1' } as ModuleEntity;
            const items = [{ label: 'Use 1', icon: 'icon-1' }] as MRelationDto[];

            const existingUses = [{ label: 'use 1', icon: 'old-icon-1' }] as MUseEntity[];

            mockMUseRepository.find.mockResolvedValue(existingUses);

            await service.createUses(module, items);

            expect(mockMUseRepository.createMany).not.toHaveBeenCalled();
        });

        it('should handle duplicate items in input array', async () => {
            const module = { id: 'module-1' } as ModuleEntity;
            const item1 = { label: 'Use 1', icon: 'icon-1' } as MRelationDto;
            const item2 = { label: 'Use 1', icon: 'icon-1' } as MRelationDto;
            const items = [item1, item2, item1];

            mockMUseRepository.find.mockResolvedValue([]);

            await service.createUses(module, items);

            // Should deduplicate based on Set
            expect(mockMUseRepository.createMany).toHaveBeenCalled();
        });
    });

    describe('updateUses', () => {
        it('should return early when items array is empty', async () => {
            const module = { id: 'module-1' } as ModuleEntity;

            await service.updateUses(module, []);

            expect(mockMUseRepository.find).not.toHaveBeenCalled();
            expect(mockMUseRepository.update).not.toHaveBeenCalled();
        });

        it('should update uses successfully when no label conflicts exist', async () => {
            const module = { id: 'module-1' } as ModuleEntity;
            const items = [
                {
                    id: 'use-1',
                    label: 'Updated Label 1',
                    icon: 'updated-icon-1',
                },
                {
                    id: 'use-2',
                    label: 'Updated Label 2',
                    icon: 'updated-icon-2',
                },
            ] as MRelationDto[];

            const existingUses = [
                { id: 'use-1', label: 'Old Label 1', icon: 'old-icon-1' },
                { id: 'use-2', label: 'Old Label 2', icon: 'old-icon-2' },
            ] as MUseEntity[];

            mockMUseRepository.find.mockResolvedValue(existingUses);
            mockMUseRepository.findOne.mockResolvedValue(null);
            mockMUseRepository.update.mockResolvedValue({ affected: 1 });

            await service.updateUses(module, items);

            expect(mockMUseRepository.findOne).toHaveBeenCalledTimes(2);
            expect(mockMUseRepository.findOne).toHaveBeenCalledWith({
                where: {
                    module: { id: 'module-1' },
                    id: expect.any(Object),
                    label: 'Updated Label 1',
                },
            });
            expect(mockMUseRepository.update).toHaveBeenCalledTimes(2);
        });

        it('should not update when label conflict exists', async () => {
            const module = { id: 'module-1' } as ModuleEntity;
            const items = [
                {
                    id: 'use-1',
                    label: 'Conflicting Label',
                    icon: 'updated-icon-1',
                },
            ] as MRelationDto[];

            const existingUses = [
                { id: 'use-1', label: 'Old Label', icon: 'old-icon' },
            ] as MUseEntity[];

            const conflictingUse = {
                id: 'use-2',
                label: 'Conflicting Label',
            } as MUseEntity;

            mockMUseRepository.find.mockResolvedValue(existingUses);
            mockMUseRepository.findOne.mockResolvedValue(conflictingUse);

            await service.updateUses(module, items);

            expect(mockMUseRepository.findOne).toHaveBeenCalledWith({
                where: {
                    module: { id: 'module-1' },
                    id: expect.any(Object),
                    label: 'Conflicting Label',
                },
            });
            expect(mockMUseRepository.update).not.toHaveBeenCalled();
        });

        it('should handle multiple uses with mixed conflict scenarios', async () => {
            const module = { id: 'module-1' } as ModuleEntity;
            const items = [
                { id: 'use-1', label: 'Safe Label', icon: 'icon-1' },
                { id: 'use-2', label: 'Conflict Label', icon: 'icon-2' },
                { id: 'use-3', label: 'Another Safe', icon: 'icon-3' },
            ] as MRelationDto[];

            const existingUses = [
                { id: 'use-1', label: 'Old 1', icon: 'old-1' },
                { id: 'use-2', label: 'Old 2', icon: 'old-2' },
                { id: 'use-3', label: 'Old 3', icon: 'old-3' },
            ] as MUseEntity[];

            mockMUseRepository.find.mockResolvedValue(existingUses);
            mockMUseRepository.findOne
                .mockResolvedValueOnce(null) // use-1: no conflict
                .mockResolvedValueOnce({ id: 'use-4' } as MUseEntity) // use-2: conflict
                .mockResolvedValueOnce(null); // use-3: no conflict
            mockMUseRepository.update.mockResolvedValue({ affected: 1 });

            await service.updateUses(module, items);

            expect(mockMUseRepository.update).toHaveBeenCalledTimes(2); // Only use-1 and use-3
        });
    });

    describe('processModuleUses', () => {
        it('should return early when dto is undefined', async () => {
            const module = { id: 'module-1' } as ModuleEntity;

            await service.processModuleUses(module, undefined);

            expect(mockPreModuleService.splitByMethod).not.toHaveBeenCalled();
        });

        it('should return early when dto is empty array', async () => {
            const module = { id: 'module-1' } as ModuleEntity;

            await service.processModuleUses(module, []);

            expect(mockPreModuleService.splitByMethod).not.toHaveBeenCalled();
        });

        it('should process creates and updates in parallel', async () => {
            const module = { id: 'module-1' } as ModuleEntity;
            const dto = [
                {
                    method: ModuleMethodEnum.CREATE,
                    label: 'New Use',
                    icon: 'icon-1',
                },
                {
                    method: ModuleMethodEnum.UPDATE,
                    id: 'use-1',
                    label: 'Updated',
                    icon: 'icon-2',
                },
            ] as MRelationDto[];

            const creates = [dto[0]];
            const updates = [dto[1]];

            mockPreModuleService.splitByMethod.mockReturnValue({
                creates,
                updates,
            });
            mockMUseRepository.find.mockResolvedValue([]);
            mockMUseRepository.createMany.mockResolvedValue(undefined);
            mockMUseRepository.update.mockResolvedValue({ affected: 1 });

            const createUsesSpy = jest.spyOn(service, 'createUses');
            const updateUsesSpy = jest.spyOn(service, 'updateUses');

            await service.processModuleUses(module, dto);

            expect(mockPreModuleService.splitByMethod).toHaveBeenCalledWith(dto);
            expect(createUsesSpy).toHaveBeenCalledWith(module, creates);
            expect(updateUsesSpy).toHaveBeenCalledWith(module, updates);
        });

        it('should handle only creates', async () => {
            const module = { id: 'module-1' } as ModuleEntity;
            const dto = [
                {
                    method: ModuleMethodEnum.CREATE,
                    label: 'New Use',
                    icon: 'icon-1',
                },
            ] as MRelationDto[];

            const creates = [dto[0]];
            const updates: MRelationDto[] = [];

            mockPreModuleService.splitByMethod.mockReturnValue({
                creates,
                updates,
            });
            mockMUseRepository.find.mockResolvedValue([]);
            mockMUseRepository.createMany.mockResolvedValue(undefined);

            await service.processModuleUses(module, dto);

            expect(mockPreModuleService.splitByMethod).toHaveBeenCalledWith(dto);
        });

        it('should handle only updates', async () => {
            const module = { id: 'module-1' } as ModuleEntity;
            const dto = [
                {
                    method: ModuleMethodEnum.UPDATE,
                    id: 'use-1',
                    label: 'Updated',
                    icon: 'icon-1',
                },
            ] as MRelationDto[];

            const creates: MRelationDto[] = [];
            const updates = [dto[0]];

            const existingUse = { id: 'use-1', label: 'Old' } as MUseEntity;

            mockPreModuleService.splitByMethod.mockReturnValue({
                creates,
                updates,
            });
            mockMUseRepository.find.mockResolvedValue([existingUse]);
            mockMUseRepository.findOne.mockResolvedValue(null);
            mockMUseRepository.update.mockResolvedValue({ affected: 1 });

            await service.processModuleUses(module, dto);

            expect(mockPreModuleService.splitByMethod).toHaveBeenCalledWith(dto);
        });
    });

    describe('deleteMUse', () => {
        it('should delete MUse successfully', async () => {
            const id = 'use-1';
            const mId = 'module-1';

            mockMUseRepository.delete.mockResolvedValue({ affected: 1 });

            const result = await service.deleteMUse(id, mId);

            expect(mockMUseRepository.delete).toHaveBeenCalledWith({
                id: 'use-1',
                module: { id: 'module-1' },
            });
            expect(result).toEqual({ message: 'Module use deleted' });
        });

        it('should call delete even when no records are affected', async () => {
            const id = 'non-existent';
            const mId = 'module-1';

            mockMUseRepository.delete.mockResolvedValue({ affected: 0 });

            const result = await service.deleteMUse(id, mId);

            expect(mockMUseRepository.delete).toHaveBeenCalledWith({
                id: 'non-existent',
                module: { id: 'module-1' },
            });
            expect(result).toEqual({ message: 'Module use deleted' });
        });
    });
});
