import { Test, TestingModule } from '@nestjs/testing';
import { MFeatureService } from './m-feature.service';
import { ModulesService } from './modules.service';
import { ModuleEntity, MFeatureEntity } from '../entities';
import { MRelationDto } from '../dto';
import { ModuleMethodEnum } from '../../../common/enum';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('MFeatureService', () => {
    let service: MFeatureService;

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

    const mockMFeatureRepo = {
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
                MFeatureService,
                {
                    provide: ModulesService,
                    useValue: {
                        logger: mockLogger,
                        errorHandler: mockErrorHandler,
                        mFeatureRepo: mockMFeatureRepo,
                        preModuleService: mockPreModuleService,
                    },
                },
            ],
        }).compile();

        service = module.get<MFeatureService>(MFeatureService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('buildMFeatureEntity', () => {
        it('should build a MFeatureEntity with provided required fields', () => {
            const module = { id: 'module-1' } as ModuleEntity;
            const required = {
                label: 'Test Feature',
                icon: 'test-icon',
                module,
            };

            const result = service.buildMFeatureEntity(required);

            expect(result).toBeInstanceOf(MFeatureEntity);
            expect(result.label).toBe('Test Feature');
            expect(result.icon).toBe('test-icon');
            expect(result.module).toBe(module);
        });
    });

    describe('retrieveMFeatures', () => {
        it('should retrieve MFeatures successfully when all ids exist', async () => {
            const mId = 'module-1';
            const ids = ['feature-1', 'feature-2', 'feature-3'];
            const mockFeatures = [
                { id: 'feature-1', label: 'Feature 1' },
                { id: 'feature-2', label: 'Feature 2' },
                { id: 'feature-3', label: 'Feature 3' },
            ] as MFeatureEntity[];

            mockMFeatureRepo.find.mockResolvedValue(mockFeatures);

            const result = await service.retrieveMFeatures(ids, mId);

            expect(mockLogger.info).toHaveBeenCalledWith(
                `Retrieve a module (id: ${mId} features with ids: ${ids.join(', ')}`,
            );
            expect(mockMFeatureRepo.find).toHaveBeenCalledWith({
                where: {
                    deleted: false,
                    module: { id: mId },
                    id: expect.any(Object),
                },
            });
            expect(result).toEqual(mockFeatures);
        });

        it('should filter duplicate ids before retrieving', async () => {
            const mId = 'module-1';
            const ids = ['feature-1', 'feature-2', 'feature-1', 'feature-2'];
            const mockFeatures = [
                { id: 'feature-1', label: 'Feature 1' },
                { id: 'feature-2', label: 'Feature 2' },
            ] as MFeatureEntity[];

            mockMFeatureRepo.find.mockResolvedValue(mockFeatures);

            const result = await service.retrieveMFeatures(ids, mId);

            expect(mockLogger.info).toHaveBeenCalledWith(
                `Retrieve a module (id: ${mId} features with ids: feature-1, feature-2`,
            );
            expect(result).toEqual(mockFeatures);
        });

        it('should throw notFound error when some features are not found', async () => {
            const mId = 'module-1';
            const ids = ['feature-1', 'feature-2', 'feature-3'];
            const mockFeatures = [{ id: 'feature-1', label: 'Feature 1' }] as MFeatureEntity[];

            mockMFeatureRepo.find.mockResolvedValue(mockFeatures);

            await service.retrieveMFeatures(ids, mId);

            expect(mockErrorHandler.notFound).toHaveBeenCalledWith(
                `Some module feature aren't found`,
                `Features not found`,
            );
        });
    });

    describe('updateMFeatureDetails', () => {
        it('should return message when no updates provided', async () => {
            const feature = { id: 'feature-1' } as MFeatureEntity;

            const result = await service.updateMFeatureDetails(feature, undefined);

            expect(result).toEqual({
                message: 'No updates provided for module features',
            });
            expect(mockMFeatureRepo.update).not.toHaveBeenCalled();
        });

        it('should return message when updates object is empty', async () => {
            const feature = { id: 'feature-1' } as MFeatureEntity;

            const result = await service.updateMFeatureDetails(feature, {});

            expect(result).toEqual({
                message: 'No updates provided for module features',
            });
            expect(mockMFeatureRepo.update).not.toHaveBeenCalled();
        });

        it('should update label when provided', async () => {
            const feature = { id: 'feature-1' } as MFeatureEntity;
            const updates = { label: '  Updated Feature  ' };
            const updateResult = { affected: 1 };

            mockMFeatureRepo.update.mockResolvedValue(updateResult);

            const result = await service.updateMFeatureDetails(feature, updates);

            expect(mockMFeatureRepo.update).toHaveBeenCalledWith(
                { id: 'feature-1' },
                { label: 'Updated Feature' },
            );
            expect(result).toEqual(updateResult);
        });

        it('should update icon when provided', async () => {
            const feature = { id: 'feature-1' } as MFeatureEntity;
            const updates = { icon: '  updated-icon  ' };
            const updateResult = { affected: 1 };

            mockMFeatureRepo.update.mockResolvedValue(updateResult);

            const result = await service.updateMFeatureDetails(feature, updates);

            expect(mockMFeatureRepo.update).toHaveBeenCalledWith(
                { id: 'feature-1' },
                { icon: 'updated-icon' },
            );
            expect(result).toEqual(updateResult);
        });

        it('should update module when provided', async () => {
            const feature = { id: 'feature-1' } as MFeatureEntity;
            const newModule = { id: 'module-2' } as ModuleEntity;
            const updates = { module: newModule };
            const updateResult = { affected: 1 };

            mockMFeatureRepo.update.mockResolvedValue(updateResult);

            const result = await service.updateMFeatureDetails(feature, updates);

            expect(mockMFeatureRepo.update).toHaveBeenCalledWith(
                { id: 'feature-1' },
                { module: newModule },
            );
            expect(result).toEqual(updateResult);
        });

        it('should update multiple fields when provided', async () => {
            const feature = { id: 'feature-1' } as MFeatureEntity;
            const newModule = { id: 'module-2' } as ModuleEntity;
            const updates = {
                label: '  New Feature  ',
                icon: '  new-icon  ',
                module: newModule,
            };
            const updateResult = { affected: 1 };

            mockMFeatureRepo.update.mockResolvedValue(updateResult);

            const result = await service.updateMFeatureDetails(feature, updates);

            expect(mockMFeatureRepo.update).toHaveBeenCalledWith(
                { id: 'feature-1' },
                {
                    label: 'New Feature',
                    icon: 'new-icon',
                    module: newModule,
                },
            );
            expect(result).toEqual(updateResult);
        });

        it('should not include empty string fields in update payload', async () => {
            const feature = { id: 'feature-1' } as MFeatureEntity;
            const updates = {
                label: '   ',
                icon: '',
            };
            const updateResult = { affected: 1 };

            mockMFeatureRepo.update.mockResolvedValue(updateResult);

            const result = await service.updateMFeatureDetails(feature, updates);

            expect(mockMFeatureRepo.update).toHaveBeenCalledWith({ id: 'feature-1' }, {});
            expect(result).toEqual(updateResult);
        });
    });

    describe('createFeatures', () => {
        it('should return early when items array is empty', async () => {
            const module = { id: 'module-1' } as ModuleEntity;

            await service.createFeatures(module, []);

            expect(mockMFeatureRepo.find).not.toHaveBeenCalled();
            expect(mockMFeatureRepo.createMany).not.toHaveBeenCalled();
        });

        it('should create new features when no duplicates exist', async () => {
            const module = { id: 'module-1' } as ModuleEntity;
            const items = [
                { label: 'Feature 1', icon: 'icon-1' },
                { label: 'Feature 2', icon: 'icon-2' },
            ] as MRelationDto[];

            mockMFeatureRepo.find.mockResolvedValue([]);

            await service.createFeatures(module, items);

            expect(mockMFeatureRepo.find).toHaveBeenCalledWith({
                where: { module: { id: 'module-1' } },
            });
            expect(mockMFeatureRepo.createMany).toHaveBeenCalledWith([
                expect.objectContaining({
                    label: 'Feature 1',
                    icon: 'icon-1',
                    module,
                }),
                expect.objectContaining({
                    label: 'Feature 2',
                    icon: 'icon-2',
                    module,
                }),
            ]);
        });

        it('should filter out existing features (case-insensitive)', async () => {
            const module = { id: 'module-1' } as ModuleEntity;
            const items = [
                { label: 'Feature 1', icon: 'icon-1' },
                { label: '  FEATURE 2  ', icon: 'icon-2' },
                { label: 'Feature 3', icon: 'icon-3' },
            ] as MRelationDto[];

            const existingFeatures = [
                { label: 'feature 1', icon: 'old-icon-1' },
            ] as MFeatureEntity[];

            mockMFeatureRepo.find.mockResolvedValue(existingFeatures);

            await service.createFeatures(module, items);

            expect(mockMFeatureRepo.createMany).toHaveBeenCalledWith([
                expect.objectContaining({
                    label: 'FEATURE 2',
                    icon: 'icon-2',
                    module,
                }),
                expect.objectContaining({
                    label: 'Feature 3',
                    icon: 'icon-3',
                    module,
                }),
            ]);
        });

        it('should filter out items without label', async () => {
            const module = { id: 'module-1' } as ModuleEntity;
            const items = [
                { label: 'Feature 1', icon: 'icon-1' },
                { icon: 'icon-2' } as MRelationDto,
                { label: '', icon: 'icon-3' },
                { label: '   ', icon: 'icon-4' },
            ] as MRelationDto[];

            mockMFeatureRepo.find.mockResolvedValue([]);

            await service.createFeatures(module, items);

            expect(mockMFeatureRepo.createMany).toHaveBeenCalledWith([
                expect.objectContaining({
                    label: 'Feature 1',
                    icon: 'icon-1',
                    module,
                }),
            ]);
        });

        it('should not create anything when all items are duplicates', async () => {
            const module = { id: 'module-1' } as ModuleEntity;
            const items = [{ label: 'Feature 1', icon: 'icon-1' }] as MRelationDto[];

            const existingFeatures = [
                { label: 'feature 1', icon: 'old-icon-1' },
            ] as MFeatureEntity[];

            mockMFeatureRepo.find.mockResolvedValue(existingFeatures);

            await service.createFeatures(module, items);

            expect(mockMFeatureRepo.createMany).not.toHaveBeenCalled();
        });

        it('should handle duplicate items in input array', async () => {
            const module = { id: 'module-1' } as ModuleEntity;
            const item1 = {
                label: 'Feature 1',
                icon: 'icon-1',
            } as MRelationDto;
            const item2 = {
                label: 'Feature 1',
                icon: 'icon-1',
            } as MRelationDto;
            const items = [item1, item2, item1];

            mockMFeatureRepo.find.mockResolvedValue([]);

            await service.createFeatures(module, items);

            // Should deduplicate based on Set
            expect(mockMFeatureRepo.createMany).toHaveBeenCalled();
        });
    });

    describe('updateFeatures', () => {
        it('should return early when items array is empty', async () => {
            const module = { id: 'module-1' } as ModuleEntity;

            await service.updateFeatures(module, []);

            expect(mockMFeatureRepo.find).not.toHaveBeenCalled();
            expect(mockMFeatureRepo.update).not.toHaveBeenCalled();
        });

        it('should update features successfully when no label conflicts exist', async () => {
            const module = { id: 'module-1' } as ModuleEntity;
            const items = [
                {
                    id: 'feature-1',
                    label: 'Updated Feature 1',
                    icon: 'updated-icon-1',
                },
                {
                    id: 'feature-2',
                    label: 'Updated Feature 2',
                    icon: 'updated-icon-2',
                },
            ] as MRelationDto[];

            const existingFeatures = [
                { id: 'feature-1', label: 'Old Feature 1', icon: 'old-icon-1' },
                { id: 'feature-2', label: 'Old Feature 2', icon: 'old-icon-2' },
            ] as MFeatureEntity[];

            mockMFeatureRepo.find.mockResolvedValue(existingFeatures);
            mockMFeatureRepo.findOne.mockResolvedValue(null);
            mockMFeatureRepo.update.mockResolvedValue({ affected: 1 });

            await service.updateFeatures(module, items);

            expect(mockMFeatureRepo.findOne).toHaveBeenCalledTimes(2);
            expect(mockMFeatureRepo.findOne).toHaveBeenCalledWith({
                where: {
                    module: { id: 'module-1' },
                    id: expect.any(Object),
                    label: 'Updated Feature 1',
                },
            });
            expect(mockMFeatureRepo.update).toHaveBeenCalledTimes(2);
        });

        it('should not update when label conflict exists', async () => {
            const module = { id: 'module-1' } as ModuleEntity;
            const items = [
                {
                    id: 'feature-1',
                    label: 'Conflicting Label',
                    icon: 'updated-icon-1',
                },
            ] as MRelationDto[];

            const existingFeatures = [
                { id: 'feature-1', label: 'Old Label', icon: 'old-icon' },
            ] as MFeatureEntity[];

            const conflictingFeature = {
                id: 'feature-2',
                label: 'Conflicting Label',
            } as MFeatureEntity;

            mockMFeatureRepo.find.mockResolvedValue(existingFeatures);
            mockMFeatureRepo.findOne.mockResolvedValue(conflictingFeature);

            await service.updateFeatures(module, items);

            expect(mockMFeatureRepo.findOne).toHaveBeenCalledWith({
                where: {
                    module: { id: 'module-1' },
                    id: expect.any(Object),
                    label: 'Conflicting Label',
                },
            });
            expect(mockMFeatureRepo.update).not.toHaveBeenCalled();
        });

        it('should handle multiple features with mixed conflict scenarios', async () => {
            const module = { id: 'module-1' } as ModuleEntity;
            const items = [
                { id: 'feature-1', label: 'Safe Label', icon: 'icon-1' },
                { id: 'feature-2', label: 'Conflict Label', icon: 'icon-2' },
                { id: 'feature-3', label: 'Another Safe', icon: 'icon-3' },
            ] as MRelationDto[];

            const existingFeatures = [
                { id: 'feature-1', label: 'Old 1', icon: 'old-1' },
                { id: 'feature-2', label: 'Old 2', icon: 'old-2' },
                { id: 'feature-3', label: 'Old 3', icon: 'old-3' },
            ] as MFeatureEntity[];

            mockMFeatureRepo.find.mockResolvedValue(existingFeatures);
            mockMFeatureRepo.findOne
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce({ id: 'feature-4' } as MFeatureEntity)
                .mockResolvedValueOnce(null);
            mockMFeatureRepo.update.mockResolvedValue({ affected: 1 });

            await service.updateFeatures(module, items);

            expect(mockMFeatureRepo.update).toHaveBeenCalledTimes(2);
        });
    });

    describe('processModuleFeatures', () => {
        it('should return early when dto is undefined', async () => {
            const module = { id: 'module-1' } as ModuleEntity;

            await service.processModuleFeatures(module, undefined);

            expect(mockPreModuleService.splitByMethod).not.toHaveBeenCalled();
        });

        it('should return early when dto is empty array', async () => {
            const module = { id: 'module-1' } as ModuleEntity;

            await service.processModuleFeatures(module, []);

            expect(mockPreModuleService.splitByMethod).not.toHaveBeenCalled();
        });

        it('should process creates and updates in parallel', async () => {
            const module = { id: 'module-1' } as ModuleEntity;
            const dto = [
                {
                    method: ModuleMethodEnum.CREATE,
                    label: 'New Feature',
                    icon: 'icon-1',
                },
                {
                    method: ModuleMethodEnum.UPDATE,
                    id: 'feature-1',
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
            mockMFeatureRepo.find.mockResolvedValue([]);
            mockMFeatureRepo.createMany.mockResolvedValue(undefined);
            mockMFeatureRepo.update.mockResolvedValue({ affected: 1 });

            const createFeaturesSpy = jest.spyOn(service, 'createFeatures');
            const updateFeaturesSpy = jest.spyOn(service, 'updateFeatures');

            await service.processModuleFeatures(module, dto);

            expect(mockPreModuleService.splitByMethod).toHaveBeenCalledWith(dto);
            expect(createFeaturesSpy).toHaveBeenCalledWith(module, creates);
            expect(updateFeaturesSpy).toHaveBeenCalledWith(module, updates);
        });

        it('should handle only creates', async () => {
            const module = { id: 'module-1' } as ModuleEntity;
            const dto = [
                {
                    method: ModuleMethodEnum.CREATE,
                    label: 'New Feature',
                    icon: 'icon-1',
                },
            ] as MRelationDto[];

            const creates = [dto[0]];
            const updates: MRelationDto[] = [];

            mockPreModuleService.splitByMethod.mockReturnValue({
                creates,
                updates,
            });
            mockMFeatureRepo.find.mockResolvedValue([]);
            mockMFeatureRepo.createMany.mockResolvedValue(undefined);

            await service.processModuleFeatures(module, dto);

            expect(mockPreModuleService.splitByMethod).toHaveBeenCalledWith(dto);
        });

        it('should handle only updates', async () => {
            const module = { id: 'module-1' } as ModuleEntity;
            const dto = [
                {
                    method: ModuleMethodEnum.UPDATE,
                    id: 'feature-1',
                    label: 'Updated',
                    icon: 'icon-1',
                },
            ] as MRelationDto[];

            const creates: MRelationDto[] = [];
            const updates = [dto[0]];

            const existingFeature = {
                id: 'feature-1',
                label: 'Old',
            } as MFeatureEntity;

            mockPreModuleService.splitByMethod.mockReturnValue({
                creates,
                updates,
            });
            mockMFeatureRepo.find.mockResolvedValue([existingFeature]);
            mockMFeatureRepo.findOne.mockResolvedValue(null);
            mockMFeatureRepo.update.mockResolvedValue({ affected: 1 });

            await service.processModuleFeatures(module, dto);

            expect(mockPreModuleService.splitByMethod).toHaveBeenCalledWith(dto);
        });
    });

    describe('deleteMFeature', () => {
        it('should delete MFeature successfully', async () => {
            const id = 'feature-1';
            const mId = 'module-1';

            mockMFeatureRepo.delete.mockResolvedValue({ affected: 1 });

            const result = await service.deleteMFeature(id, mId);

            expect(mockMFeatureRepo.delete).toHaveBeenCalledWith({
                id: 'feature-1',
                module: { id: 'module-1' },
            });
            expect(result).toEqual({ message: 'Module feature deleted' });
        });

        it('should call delete even when no records are affected', async () => {
            const id = 'non-existent';
            const mId = 'module-1';

            mockMFeatureRepo.delete.mockResolvedValue({ affected: 0 });

            const result = await service.deleteMFeature(id, mId);

            expect(mockMFeatureRepo.delete).toHaveBeenCalledWith({
                id: 'non-existent',
                module: { id: 'module-1' },
            });
            expect(result).toEqual({ message: 'Module feature deleted' });
        });
    });
});
