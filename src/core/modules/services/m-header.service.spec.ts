import { Test, TestingModule } from '@nestjs/testing';
import { MHeaderService } from './m-header.service';
import { ModulesService } from './modules.service';
import { ModuleEntity, MHeaderEntity } from '../entities';
import { MRelationDto } from '../dto';
import { ModuleMethodEnum } from '../../../common/enum';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('MHeaderService', () => {
    let service: MHeaderService;

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

    const mockMHeaderRepo = {
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
                MHeaderService,
                {
                    provide: ModulesService,
                    useValue: {
                        logger: mockLogger,
                        errorHandler: mockErrorHandler,
                        mHeaderRepo: mockMHeaderRepo,
                        preModuleService: mockPreModuleService,
                    },
                },
            ],
        }).compile();

        service = module.get<MHeaderService>(MHeaderService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('buildMHeaderEntity', () => {
        it('should build a MHeaderEntity with provided required fields', () => {
            const module = { id: 'module-1' } as ModuleEntity;
            const required = {
                label: 'Test Header',
                icon: 'test-icon',
                module,
            };

            const result = service.buildMHeaderEntity(required);

            expect(result).toBeInstanceOf(MHeaderEntity);
            expect(result.label).toBe('Test Header');
            expect(result.icon).toBe('test-icon');
            expect(result.module).toBe(module);
        });
    });

    describe('retrieveMHeaders', () => {
        it('should retrieve MHeaders successfully when all ids exist', async () => {
            const mId = 'module-1';
            const ids = ['header-1', 'header-2', 'header-3'];
            const mockHeaders = [
                { id: 'header-1', label: 'Header 1' },
                { id: 'header-2', label: 'Header 2' },
                { id: 'header-3', label: 'Header 3' },
            ] as MHeaderEntity[];

            mockMHeaderRepo.find.mockResolvedValue(mockHeaders);

            const result = await service.retrieveMHeaders(ids, mId);

            expect(mockLogger.info).toHaveBeenCalledWith(
                `Retrieve a module (id: ${mId} headers with ids: ${ids.join(', ')}`,
            );
            expect(mockMHeaderRepo.find).toHaveBeenCalledWith({
                where: {
                    deleted: false,
                    module: { id: mId },
                    id: expect.any(Object),
                },
            });
            expect(result).toEqual(mockHeaders);
        });

        it('should filter duplicate ids before retrieving', async () => {
            const mId = 'module-1';
            const ids = ['header-1', 'header-2', 'header-1', 'header-2']; // Duplicates
            const mockHeaders = [
                { id: 'header-1', label: 'Header 1' },
                { id: 'header-2', label: 'Header 2' },
            ] as MHeaderEntity[];

            mockMHeaderRepo.find.mockResolvedValue(mockHeaders);

            const result = await service.retrieveMHeaders(ids, mId);

            expect(mockLogger.info).toHaveBeenCalledWith(
                `Retrieve a module (id: ${mId} headers with ids: header-1, header-2`,
            );
            expect(result).toEqual(mockHeaders);
        });

        it('should throw notFound error when some headers are not found', async () => {
            const mId = 'module-1';
            const ids = ['header-1', 'header-2', 'header-3'];
            const mockHeaders = [{ id: 'header-1', label: 'Header 1' }] as MHeaderEntity[];

            mockMHeaderRepo.find.mockResolvedValue(mockHeaders);

            await service.retrieveMHeaders(ids, mId);

            expect(mockErrorHandler.notFound).toHaveBeenCalledWith(
                `Some module headers aren't found`,
                `Headers not found`,
            );
        });
    });

    describe('updateMHeaderDetails', () => {
        it('should return message when no updates provided', async () => {
            const header = { id: 'header-1' } as MHeaderEntity;

            const result = await service.updateMHeaderDetails(header, undefined);

            expect(result).toEqual({
                message: 'No updates provided for module headers',
            });
            expect(mockMHeaderRepo.update).not.toHaveBeenCalled();
        });

        it('should return message when updates object is empty', async () => {
            const header = { id: 'header-1' } as MHeaderEntity;

            const result = await service.updateMHeaderDetails(header, {});

            expect(result).toEqual({
                message: 'No updates provided for module headers',
            });
            expect(mockMHeaderRepo.update).not.toHaveBeenCalled();
        });

        it('should update label when provided', async () => {
            const header = { id: 'header-1' } as MHeaderEntity;
            const updates = { label: '  Updated Header  ' };
            const updateResult = { affected: 1 };

            mockMHeaderRepo.update.mockResolvedValue(updateResult);

            const result = await service.updateMHeaderDetails(header, updates);

            expect(mockMHeaderRepo.update).toHaveBeenCalledWith(
                { id: 'header-1' },
                { label: 'Updated Header' },
            );
            expect(result).toEqual(updateResult);
        });

        it('should update icon when provided', async () => {
            const header = { id: 'header-1' } as MHeaderEntity;
            const updates = { icon: '  updated-icon  ' };
            const updateResult = { affected: 1 };

            mockMHeaderRepo.update.mockResolvedValue(updateResult);

            const result = await service.updateMHeaderDetails(header, updates);

            expect(mockMHeaderRepo.update).toHaveBeenCalledWith(
                { id: 'header-1' },
                { icon: 'updated-icon' },
            );
            expect(result).toEqual(updateResult);
        });

        it('should update module when provided', async () => {
            const header = { id: 'header-1' } as MHeaderEntity;
            const newModule = { id: 'module-2' } as ModuleEntity;
            const updates = { module: newModule };
            const updateResult = { affected: 1 };

            mockMHeaderRepo.update.mockResolvedValue(updateResult);

            const result = await service.updateMHeaderDetails(header, updates);

            expect(mockMHeaderRepo.update).toHaveBeenCalledWith(
                { id: 'header-1' },
                { module: newModule },
            );
            expect(result).toEqual(updateResult);
        });

        it('should update multiple fields when provided', async () => {
            const header = { id: 'header-1' } as MHeaderEntity;
            const newModule = { id: 'module-2' } as ModuleEntity;
            const updates = {
                label: '  New Header  ',
                icon: '  new-icon  ',
                module: newModule,
            };
            const updateResult = { affected: 1 };

            mockMHeaderRepo.update.mockResolvedValue(updateResult);

            const result = await service.updateMHeaderDetails(header, updates);

            expect(mockMHeaderRepo.update).toHaveBeenCalledWith(
                { id: 'header-1' },
                {
                    label: 'New Header',
                    icon: 'new-icon',
                    module: newModule,
                },
            );
            expect(result).toEqual(updateResult);
        });

        it('should not include empty string fields in update payload', async () => {
            const header = { id: 'header-1' } as MHeaderEntity;
            const updates = {
                label: '   ',
                icon: '',
            };
            const updateResult = { affected: 1 };

            mockMHeaderRepo.update.mockResolvedValue(updateResult);

            const result = await service.updateMHeaderDetails(header, updates);

            expect(mockMHeaderRepo.update).toHaveBeenCalledWith({ id: 'header-1' }, {});
            expect(result).toEqual(updateResult);
        });
    });

    describe('createHeaders', () => {
        it('should return early when items array is empty', async () => {
            const module = { id: 'module-1' } as ModuleEntity;

            await service.createHeaders(module, []);

            expect(mockMHeaderRepo.find).not.toHaveBeenCalled();
            expect(mockMHeaderRepo.createMany).not.toHaveBeenCalled();
        });

        it('should create new headers when no duplicates exist', async () => {
            const module = { id: 'module-1' } as ModuleEntity;
            const items = [
                { label: 'Header 1', icon: 'icon-1' },
                { label: 'Header 2', icon: 'icon-2' },
            ] as MRelationDto[];

            mockMHeaderRepo.find.mockResolvedValue([]);

            await service.createHeaders(module, items);

            expect(mockMHeaderRepo.find).toHaveBeenCalledWith({
                where: { module: { id: 'module-1' } },
            });
            expect(mockMHeaderRepo.createMany).toHaveBeenCalledWith([
                expect.objectContaining({
                    label: 'Header 1',
                    icon: 'icon-1',
                    module,
                }),
                expect.objectContaining({
                    label: 'Header 2',
                    icon: 'icon-2',
                    module,
                }),
            ]);
        });

        it('should filter out existing headers (case-insensitive)', async () => {
            const module = { id: 'module-1' } as ModuleEntity;
            const items = [
                { label: 'Header 1', icon: 'icon-1' },
                { label: '  HEADER 2  ', icon: 'icon-2' },
                { label: 'Header 3', icon: 'icon-3' },
            ] as MRelationDto[];

            const existingHeaders = [{ label: 'header 1', icon: 'old-icon-1' }] as MHeaderEntity[];

            mockMHeaderRepo.find.mockResolvedValue(existingHeaders);

            await service.createHeaders(module, items);

            expect(mockMHeaderRepo.createMany).toHaveBeenCalledWith([
                expect.objectContaining({
                    label: 'HEADER 2',
                    icon: 'icon-2',
                    module,
                }),
                expect.objectContaining({
                    label: 'Header 3',
                    icon: 'icon-3',
                    module,
                }),
            ]);
        });

        it('should filter out items without label', async () => {
            const module = { id: 'module-1' } as ModuleEntity;
            const items = [
                { label: 'Header 1', icon: 'icon-1' },
                { icon: 'icon-2' } as MRelationDto,
                { label: '', icon: 'icon-3' },
                { label: '   ', icon: 'icon-4' },
            ] as MRelationDto[];

            mockMHeaderRepo.find.mockResolvedValue([]);

            await service.createHeaders(module, items);

            expect(mockMHeaderRepo.createMany).toHaveBeenCalledWith([
                expect.objectContaining({
                    label: 'Header 1',
                    icon: 'icon-1',
                    module,
                }),
            ]);
        });

        it('should not create anything when all items are duplicates', async () => {
            const module = { id: 'module-1' } as ModuleEntity;
            const items = [{ label: 'Header 1', icon: 'icon-1' }] as MRelationDto[];

            const existingHeaders = [{ label: 'header 1', icon: 'old-icon-1' }] as MHeaderEntity[];

            mockMHeaderRepo.find.mockResolvedValue(existingHeaders);

            await service.createHeaders(module, items);

            expect(mockMHeaderRepo.createMany).not.toHaveBeenCalled();
        });

        it('should handle duplicate items in input array', async () => {
            const module = { id: 'module-1' } as ModuleEntity;
            const item1 = { label: 'Header 1', icon: 'icon-1' } as MRelationDto;
            const item2 = { label: 'Header 1', icon: 'icon-1' } as MRelationDto;
            const items = [item1, item2, item1];

            mockMHeaderRepo.find.mockResolvedValue([]);

            await service.createHeaders(module, items);

            // Should deduplicate based on Set
            expect(mockMHeaderRepo.createMany).toHaveBeenCalled();
        });
    });

    describe('updateHeaders', () => {
        it('should return early when items array is empty', async () => {
            const module = { id: 'module-1' } as ModuleEntity;

            await service.updateHeaders(module, []);

            expect(mockMHeaderRepo.find).not.toHaveBeenCalled();
            expect(mockMHeaderRepo.update).not.toHaveBeenCalled();
        });

        it('should update headers successfully when no label conflicts exist', async () => {
            const module = { id: 'module-1' } as ModuleEntity;
            const items = [
                {
                    id: 'header-1',
                    label: 'Updated Header 1',
                    icon: 'updated-icon-1',
                },
                {
                    id: 'header-2',
                    label: 'Updated Header 2',
                    icon: 'updated-icon-2',
                },
            ] as MRelationDto[];

            const existingHeaders = [
                { id: 'header-1', label: 'Old Header 1', icon: 'old-icon-1' },
                { id: 'header-2', label: 'Old Header 2', icon: 'old-icon-2' },
            ] as MHeaderEntity[];

            mockMHeaderRepo.find.mockResolvedValue(existingHeaders);
            mockMHeaderRepo.findOne.mockResolvedValue(null);
            mockMHeaderRepo.update.mockResolvedValue({ affected: 1 });

            await service.updateHeaders(module, items);

            expect(mockMHeaderRepo.findOne).toHaveBeenCalledTimes(2);
            expect(mockMHeaderRepo.findOne).toHaveBeenCalledWith({
                where: {
                    module: { id: 'module-1' },
                    id: expect.any(Object),
                    label: 'Updated Header 1',
                },
            });
            expect(mockMHeaderRepo.update).toHaveBeenCalledTimes(2);
        });

        it('should not update when label conflict exists', async () => {
            const module = { id: 'module-1' } as ModuleEntity;
            const items = [
                {
                    id: 'header-1',
                    label: 'Conflicting Label',
                    icon: 'updated-icon-1',
                },
            ] as MRelationDto[];

            const existingHeaders = [
                { id: 'header-1', label: 'Old Label', icon: 'old-icon' },
            ] as MHeaderEntity[];

            const conflictingHeader = {
                id: 'header-2',
                label: 'Conflicting Label',
            } as MHeaderEntity;

            mockMHeaderRepo.find.mockResolvedValue(existingHeaders);
            mockMHeaderRepo.findOne.mockResolvedValue(conflictingHeader);

            await service.updateHeaders(module, items);

            expect(mockMHeaderRepo.findOne).toHaveBeenCalledWith({
                where: {
                    module: { id: 'module-1' },
                    id: expect.any(Object),
                    label: 'Conflicting Label',
                },
            });
            expect(mockMHeaderRepo.update).not.toHaveBeenCalled();
        });

        it('should handle multiple headers with mixed conflict scenarios', async () => {
            const module = { id: 'module-1' } as ModuleEntity;
            const items = [
                { id: 'header-1', label: 'Safe Label', icon: 'icon-1' },
                { id: 'header-2', label: 'Conflict Label', icon: 'icon-2' },
                { id: 'header-3', label: 'Another Safe', icon: 'icon-3' },
            ] as MRelationDto[];

            const existingHeaders = [
                { id: 'header-1', label: 'Old 1', icon: 'old-1' },
                { id: 'header-2', label: 'Old 2', icon: 'old-2' },
                { id: 'header-3', label: 'Old 3', icon: 'old-3' },
            ] as MHeaderEntity[];

            mockMHeaderRepo.find.mockResolvedValue(existingHeaders);
            mockMHeaderRepo.findOne
                .mockResolvedValueOnce(null) // header-1: no conflict
                .mockResolvedValueOnce({ id: 'header-4' } as MHeaderEntity) // header-2: conflict
                .mockResolvedValueOnce(null); // header-3: no conflict
            mockMHeaderRepo.update.mockResolvedValue({ affected: 1 });

            await service.updateHeaders(module, items);

            expect(mockMHeaderRepo.update).toHaveBeenCalledTimes(2); // Only header-1 and header-3
        });
    });

    describe('processModuleHeaders', () => {
        it('should return early when dto is undefined', async () => {
            const module = { id: 'module-1' } as ModuleEntity;

            await service.processModuleHeaders(module, undefined);

            expect(mockPreModuleService.splitByMethod).not.toHaveBeenCalled();
        });

        it('should return early when dto is empty array', async () => {
            const module = { id: 'module-1' } as ModuleEntity;

            await service.processModuleHeaders(module, []);

            expect(mockPreModuleService.splitByMethod).not.toHaveBeenCalled();
        });

        it('should process creates and updates in parallel', async () => {
            const module = { id: 'module-1' } as ModuleEntity;
            const dto = [
                {
                    method: ModuleMethodEnum.CREATE,
                    label: 'New Header',
                    icon: 'icon-1',
                },
                {
                    method: ModuleMethodEnum.UPDATE,
                    id: 'header-1',
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
            mockMHeaderRepo.find.mockResolvedValue([]);
            mockMHeaderRepo.createMany.mockResolvedValue(undefined);
            mockMHeaderRepo.update.mockResolvedValue({ affected: 1 });

            const createHeadersSpy = jest.spyOn(service, 'createHeaders');
            const updateHeadersSpy = jest.spyOn(service, 'updateHeaders');

            await service.processModuleHeaders(module, dto);

            expect(mockPreModuleService.splitByMethod).toHaveBeenCalledWith(dto);
            expect(createHeadersSpy).toHaveBeenCalledWith(module, creates);
            expect(updateHeadersSpy).toHaveBeenCalledWith(module, updates);
        });

        it('should handle only creates', async () => {
            const module = { id: 'module-1' } as ModuleEntity;
            const dto = [
                {
                    method: ModuleMethodEnum.CREATE,
                    label: 'New Header',
                    icon: 'icon-1',
                },
            ] as MRelationDto[];

            const creates = [dto[0]];
            const updates: MRelationDto[] = [];

            mockPreModuleService.splitByMethod.mockReturnValue({
                creates,
                updates,
            });
            mockMHeaderRepo.find.mockResolvedValue([]);
            mockMHeaderRepo.createMany.mockResolvedValue(undefined);

            await service.processModuleHeaders(module, dto);

            expect(mockPreModuleService.splitByMethod).toHaveBeenCalledWith(dto);
        });

        it('should handle only updates', async () => {
            const module = { id: 'module-1' } as ModuleEntity;
            const dto = [
                {
                    method: ModuleMethodEnum.UPDATE,
                    id: 'header-1',
                    label: 'Updated',
                    icon: 'icon-1',
                },
            ] as MRelationDto[];

            const creates: MRelationDto[] = [];
            const updates = [dto[0]];

            const existingHeader = {
                id: 'header-1',
                label: 'Old',
            } as MHeaderEntity;

            mockPreModuleService.splitByMethod.mockReturnValue({
                creates,
                updates,
            });
            mockMHeaderRepo.find.mockResolvedValue([existingHeader]);
            mockMHeaderRepo.findOne.mockResolvedValue(null);
            mockMHeaderRepo.update.mockResolvedValue({ affected: 1 });

            await service.processModuleHeaders(module, dto);

            expect(mockPreModuleService.splitByMethod).toHaveBeenCalledWith(dto);
        });
    });

    describe('deleteMHeader', () => {
        it('should delete MHeader successfully', async () => {
            const id = 'header-1';
            const mId = 'module-1';

            mockMHeaderRepo.delete.mockResolvedValue({ affected: 1 });

            const result = await service.deleteMHeader(id, mId);

            expect(mockMHeaderRepo.delete).toHaveBeenCalledWith({
                id: 'header-1',
                module: { id: 'module-1' },
            });
            expect(result).toEqual({ message: 'Module header deleted' });
        });

        it('should call delete even when no records are affected', async () => {
            const id = 'non-existent';
            const mId = 'module-1';

            mockMHeaderRepo.delete.mockResolvedValue({ affected: 0 });

            const result = await service.deleteMHeader(id, mId);

            expect(mockMHeaderRepo.delete).toHaveBeenCalledWith({
                id: 'non-existent',
                module: { id: 'module-1' },
            });
            expect(result).toEqual({ message: 'Module header deleted' });
        });
    });
});
