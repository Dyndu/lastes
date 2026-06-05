import { Test, TestingModule } from '@nestjs/testing';
import { RoomExpenseItemService } from './room-expense-item.service';
import { BAnalysisService } from './b-analysis.service';
import { RoomExpenseItemEntity, RoomSectionEntity } from '../entities';
import { CalculationMethodEnum } from '../../../common/enum';
import { CreateREItemDto, ResolveREItemDto, UpdateREItemDto } from '../dto';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

const makeSection = (id = 'section-1'): RoomSectionEntity =>
    Object.assign(new RoomSectionEntity(), { id });

const makeItemEntity = (overrides: Partial<RoomExpenseItemEntity> = {}): RoomExpenseItemEntity =>
    Object.assign(new RoomExpenseItemEntity(), {
        id: 'item-1',
        label: 'Existing label',
        cMethod: CalculationMethodEnum.TOTAL_UNIT,
        laborValue: 10,
        materialValue: 20,
        total: 30,
        deleted: false,
        ...overrides,
    });

const mockRoomExpenseItemRepo = {
    findActiveOne: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    findOne: jest.fn(),
};

const mockErrorHandler = {
    fail: jest.fn(),
    notFound: jest.fn(),
};

const mockLogger = {
    info: jest.fn(),
};

const mockOtherUtils = {
    formatCriteria: jest.fn().mockReturnValue('id=item-1'),
};

const mockBAnalysisService = {
    roomExpenseItemRepo: mockRoomExpenseItemRepo,
    errorHandler: mockErrorHandler,
    logger: mockLogger,
    otherUtils: mockOtherUtils,
};

describe('RoomExpenseItemService', () => {
    let service: RoomExpenseItemService;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RoomExpenseItemService,
                {
                    provide: BAnalysisService,
                    useValue: mockBAnalysisService,
                },
            ],
        }).compile();

        service = module.get<RoomExpenseItemService>(RoomExpenseItemService);
    });

    describe('computeTotalUnit', () => {
        it('returns the sum of laborValue and materialValue', () => {
            expect(service.computeTotalUnit(10, 20)).toBe(30);
        });

        it('handles zero values', () => {
            expect(service.computeTotalUnit(0, 0)).toBe(0);
        });

        it('handles negative values', () => {
            expect(service.computeTotalUnit(-5, 15)).toBe(10);
        });
    });

    describe('computeUnitCalculation', () => {
        it('returns the product of pricePerUnit and numberOfUnits', () => {
            expect(service.computeUnitCalculation(5, 4)).toBe(20);
        });

        it('returns 0 when one operand is 0', () => {
            expect(service.computeUnitCalculation(0, 100)).toBe(0);
        });

        it('handles decimal values', () => {
            expect(service.computeUnitCalculation(2.5, 4)).toBeCloseTo(10);
        });
    });

    describe('computeLaborMaterial', () => {
        it('returns the manualTotal unchanged', () => {
            expect(service.computeLaborMaterial(999)).toBe(999);
        });

        it('returns 0 when manualTotal is 0', () => {
            expect(service.computeLaborMaterial(0)).toBe(0);
        });
    });

    describe('resolveTotal', () => {
        it('calls computeTotalUnit for TOTAL_UNIT method', () => {
            const spy = jest.spyOn(service, 'computeTotalUnit');
            const result = service.resolveTotal(CalculationMethodEnum.TOTAL_UNIT, 10, 20);
            expect(spy).toHaveBeenCalledWith(10, 20);
            expect(result).toBe(30);
        });

        it('calls computeUnitCalculation for UNIT_CALCULATION method', () => {
            const spy = jest.spyOn(service, 'computeUnitCalculation');
            const result = service.resolveTotal(CalculationMethodEnum.UNIT_CALCULATION, 5, 4);
            expect(spy).toHaveBeenCalledWith(5, 4);
            expect(result).toBe(20);
        });

        it('calls computeLaborMaterial for LABOR_MATERIAL method with provided manualTotal', () => {
            const spy = jest.spyOn(service, 'computeLaborMaterial');
            const result = service.resolveTotal(CalculationMethodEnum.LABOR_MATERIAL, 0, 0, 500);
            expect(spy).toHaveBeenCalledWith(500);
            expect(result).toBe(500);
        });

        it('uses 0 as fallback when manualTotal is undefined for LABOR_MATERIAL', () => {
            const result = service.resolveTotal(
                CalculationMethodEnum.LABOR_MATERIAL,
                0,
                0,
                undefined,
            );
            expect(result).toBe(0);
        });

        it('calls errorHandler.fail for an unsupported calculation method', () => {
            service.resolveTotal('UNKNOWN_METHOD' as CalculationMethodEnum, 1, 2);
            expect(mockErrorHandler.fail).toHaveBeenCalledWith(
                'Unsupported calculation method: UNKNOWN_METHOD',
                'Unsupported calculation method: UNKNOWN_METHOD',
            );
        });
    });

    describe('buildREItemEntity', () => {
        it('builds a RoomExpenseItemEntity with resolved total (TOTAL_UNIT)', () => {
            const section = makeSection();
            const entity = service.buildREItemEntity({
                label: 'Test Item',
                cMethod: CalculationMethodEnum.TOTAL_UNIT,
                laborValue: 10,
                materialValue: 20,
                roomSection: section,
            });

            expect(entity).toBeInstanceOf(RoomExpenseItemEntity);
            expect(entity.label).toBe('Test Item');
            expect(entity.cMethod).toBe(CalculationMethodEnum.TOTAL_UNIT);
            expect(entity.laborValue).toBe(10);
            expect(entity.materialValue).toBe(20);
            expect(entity.total).toBe(30);
            expect(entity.roomSection).toBe(section);
        });

        it('builds entity with UNIT_CALCULATION method', () => {
            const section = makeSection();
            const entity = service.buildREItemEntity({
                label: 'Unit Item',
                cMethod: CalculationMethodEnum.UNIT_CALCULATION,
                laborValue: 5,
                materialValue: 4,
                roomSection: section,
            });

            expect(entity.total).toBe(20);
        });

        it('builds entity with LABOR_MATERIAL and a manual total', () => {
            const section = makeSection();
            const entity = service.buildREItemEntity({
                label: 'LM Item',
                cMethod: CalculationMethodEnum.LABOR_MATERIAL,
                laborValue: 0,
                materialValue: 0,
                total: 750,
                roomSection: section,
            });

            expect(entity.total).toBe(750);
        });
    });

    describe('normalizeREItemDto', () => {
        it('returns the DTO unchanged when method is not LABOR_MATERIAL', () => {
            const dto: CreateREItemDto = {
                label: 'Test',
                cMethod: CalculationMethodEnum.TOTAL_UNIT,
                laborValue: 10,
                materialValue: 20,
            } as CreateREItemDto;

            const result = service.normalizeREItemDto(dto);
            expect(result).toEqual(dto);
        });

        it('zeroes out laborValue and materialValue when method is LABOR_MATERIAL', () => {
            const dto: CreateREItemDto = {
                label: 'LM',
                cMethod: CalculationMethodEnum.LABOR_MATERIAL,
                laborValue: 100,
                materialValue: 200,
                total: 500,
            } as CreateREItemDto;

            const result = service.normalizeREItemDto(dto);
            expect(result.laborValue).toBe(0);
            expect(result.materialValue).toBe(0);
            expect(result.total).toBe(500);
        });

        it('returns a new object (does not mutate original) for LABOR_MATERIAL', () => {
            const dto: CreateREItemDto = {
                label: 'LM',
                cMethod: CalculationMethodEnum.LABOR_MATERIAL,
                laborValue: 50,
                materialValue: 50,
            } as CreateREItemDto;

            const result = service.normalizeREItemDto(dto);
            expect(result).not.toBe(dto);
        });
    });

    describe('splitDtoByMethod', () => {
        it('separates items into creates (no id) and updates (has id)', () => {
            const data: ResolveREItemDto = {
                items: [
                    {
                        label: 'New item',
                        cMethod: CalculationMethodEnum.TOTAL_UNIT,
                        laborValue: 1,
                        materialValue: 2,
                    } as UpdateREItemDto,
                    {
                        id: 'existing-1',
                        label: 'Old item',
                        cMethod: CalculationMethodEnum.TOTAL_UNIT,
                        laborValue: 1,
                        materialValue: 2,
                    } as UpdateREItemDto,
                ],
            } as ResolveREItemDto;

            const { creates, updates } = service.splitDtoByMethod(data);
            expect(creates).toHaveLength(1);
            expect(updates).toHaveLength(1);
            expect(creates[0].label).toBe('New item');
            expect(updates[0].id).toBe('existing-1');
        });

        it('puts all items in creates when none have an id', () => {
            const data: ResolveREItemDto = {
                items: [
                    {
                        label: 'A',
                        cMethod: CalculationMethodEnum.TOTAL_UNIT,
                        laborValue: 1,
                        materialValue: 1,
                    } as UpdateREItemDto,
                    {
                        label: 'B',
                        cMethod: CalculationMethodEnum.TOTAL_UNIT,
                        laborValue: 2,
                        materialValue: 2,
                    } as UpdateREItemDto,
                ],
            } as ResolveREItemDto;

            const { creates, updates } = service.splitDtoByMethod(data);
            expect(creates).toHaveLength(2);
            expect(updates).toHaveLength(0);
        });

        it('puts all items in updates when all have an id', () => {
            const data: ResolveREItemDto = {
                items: [
                    {
                        id: '1',
                        label: 'A',
                        cMethod: CalculationMethodEnum.TOTAL_UNIT,
                        laborValue: 1,
                        materialValue: 1,
                    } as UpdateREItemDto,
                    {
                        id: '2',
                        label: 'B',
                        cMethod: CalculationMethodEnum.TOTAL_UNIT,
                        laborValue: 2,
                        materialValue: 2,
                    } as UpdateREItemDto,
                ],
            } as ResolveREItemDto;

            const { creates, updates } = service.splitDtoByMethod(data);
            expect(creates).toHaveLength(0);
            expect(updates).toHaveLength(2);
        });

        it('handles an empty items array', () => {
            const data: ResolveREItemDto = { items: [] } as ResolveREItemDto;
            const { creates, updates } = service.splitDtoByMethod(data);
            expect(creates).toHaveLength(0);
            expect(updates).toHaveLength(0);
        });
    });

    describe('retrieveRExpenseByCriteria', () => {
        const criteria = { id: 'item-1' };

        it('returns the entity when found', async () => {
            const entity = makeItemEntity();
            mockRoomExpenseItemRepo.findActiveOne.mockResolvedValue(entity);

            const result = await service.retrieveRExpenseByCriteria(criteria);
            expect(result).toBe(entity);
            expect(mockLogger.info).toHaveBeenCalled();
            expect(mockOtherUtils.formatCriteria).toHaveBeenCalledWith(criteria);
        });

        it('passes relations to the repository', async () => {
            const entity = makeItemEntity();
            mockRoomExpenseItemRepo.findActiveOne.mockResolvedValue(entity);

            await service.retrieveRExpenseByCriteria(criteria, ['roomSection']);
            expect(mockRoomExpenseItemRepo.findActiveOne).toHaveBeenCalledWith(
                mockRoomExpenseItemRepo,
                criteria,
                ['roomSection'],
            );
        });

        it('calls errorHandler.notFound when entity is not found', async () => {
            mockRoomExpenseItemRepo.findActiveOne.mockResolvedValue(null);

            await service.retrieveRExpenseByCriteria(criteria);
            expect(mockErrorHandler.notFound).toHaveBeenCalled();
        });
    });

    describe('createREItems', () => {
        it('normalizes each DTO and calls createMany with built entities', async () => {
            const section = makeSection();
            const creates: CreateREItemDto[] = [
                {
                    label: 'Item A',
                    cMethod: CalculationMethodEnum.TOTAL_UNIT,
                    laborValue: 10,
                    materialValue: 20,
                } as CreateREItemDto,
                {
                    label: 'Item B',
                    cMethod: CalculationMethodEnum.LABOR_MATERIAL,
                    laborValue: 99,
                    materialValue: 99,
                    total: 300,
                } as CreateREItemDto,
            ];

            const savedEntities = creates.map(() => makeItemEntity());
            mockRoomExpenseItemRepo.createMany.mockResolvedValue(savedEntities);

            const result = await service.createREItems(section, creates);

            expect(mockRoomExpenseItemRepo.createMany).toHaveBeenCalledTimes(1);
            const passedEntities: RoomExpenseItemEntity[] =
                mockRoomExpenseItemRepo.createMany.mock.calls[0][0];

            expect(passedEntities[0].laborValue).toBe(10);
            expect(passedEntities[0].materialValue).toBe(20);
            expect(passedEntities[0].total).toBe(30);

            expect(passedEntities[1].laborValue).toBe(0);
            expect(passedEntities[1].materialValue).toBe(0);
            expect(passedEntities[1].total).toBe(300);

            expect(result).toBe(savedEntities);
        });

        it('calls createMany with empty array when creates is empty', async () => {
            mockRoomExpenseItemRepo.createMany.mockResolvedValue([]);
            await service.createREItems(makeSection(), []);
            expect(mockRoomExpenseItemRepo.createMany).toHaveBeenCalledWith([]);
        });
    });

    describe('updateREItem', () => {
        it('returns early message when itemized is undefined', async () => {
            const entity = makeItemEntity();
            const result = await service.updateREItem(entity, undefined);
            expect(result).toEqual({ message: 'No updates provided for room expense item' });
            expect(mockRoomExpenseItemRepo.update).not.toHaveBeenCalled();
        });

        it('returns early message when itemized is an empty object', async () => {
            const entity = makeItemEntity();
            const result = await service.updateREItem(entity, {});
            expect(result).toEqual({ message: 'No updates provided for room expense item' });
        });

        it('trims the label and calls repo.update', async () => {
            const entity = makeItemEntity();
            mockRoomExpenseItemRepo.update.mockResolvedValue({ affected: 1 });

            await service.updateREItem(entity, { label: '  New Label  ' });

            expect(mockRoomExpenseItemRepo.update).toHaveBeenCalledWith(
                { id: entity.id },
                expect.objectContaining({ label: 'New Label' }),
            );
        });

        it('skips label when it is an empty string after trim', async () => {
            const entity = makeItemEntity();
            mockRoomExpenseItemRepo.update.mockResolvedValue({ affected: 1 });

            await service.updateREItem(entity, {
                label: '   ',
                cMethod: CalculationMethodEnum.UNIT_CALCULATION,
            });

            const payload = mockRoomExpenseItemRepo.update.mock.calls[0][1];
            expect(payload).not.toHaveProperty('label');
            expect(payload.cMethod).toBe(CalculationMethodEnum.UNIT_CALCULATION);
        });

        it('updates numeric and enum fields correctly', async () => {
            const entity = makeItemEntity();
            mockRoomExpenseItemRepo.update.mockResolvedValue({ affected: 1 });

            await service.updateREItem(entity, {
                cMethod: CalculationMethodEnum.UNIT_CALCULATION,
                laborValue: 5,
                materialValue: 4,
                total: 20,
            });

            expect(mockRoomExpenseItemRepo.update).toHaveBeenCalledWith(
                { id: entity.id },
                {
                    cMethod: CalculationMethodEnum.UNIT_CALCULATION,
                    laborValue: 5,
                    materialValue: 4,
                    total: 20,
                },
            );
        });

        it('does not include undefined fields in the update payload', async () => {
            const entity = makeItemEntity();
            mockRoomExpenseItemRepo.update.mockResolvedValue({ affected: 1 });

            await service.updateREItem(entity, { laborValue: 99 });

            const payload = mockRoomExpenseItemRepo.update.mock.calls[0][1];
            expect(payload).not.toHaveProperty('cMethod');
            expect(payload).not.toHaveProperty('materialValue');
            expect(payload.laborValue).toBe(99);
        });
    });

    describe('normalizeREItemUpdateDto', () => {
        it('falls back to entity values when itemized fields are absent', () => {
            const entity = makeItemEntity({
                cMethod: CalculationMethodEnum.TOTAL_UNIT,
                laborValue: 10,
                materialValue: 20,
                total: 30,
            });

            const result = service.normalizeREItemUpdateDto(entity, {});
            expect(result.total).toBe(30);
        });

        it('uses provided values over entity values', () => {
            const entity = makeItemEntity({ laborValue: 1, materialValue: 1, total: 2 });

            const result = service.normalizeREItemUpdateDto(entity, {
                cMethod: CalculationMethodEnum.UNIT_CALCULATION,
                laborValue: 5,
                materialValue: 4,
            });

            expect(result.total).toBe(20);
        });

        it('zeroes labor and material and uses manual total for LABOR_MATERIAL', () => {
            const entity = makeItemEntity({ laborValue: 50, materialValue: 50, total: 100 });

            const result = service.normalizeREItemUpdateDto(entity, {
                cMethod: CalculationMethodEnum.LABOR_MATERIAL,
                total: 999,
            });

            expect(result.laborValue).toBe(0);
            expect(result.materialValue).toBe(0);
            expect(result.total).toBe(999);
        });

        it('falls back to entity total for LABOR_MATERIAL when no total is provided', () => {
            const entity = makeItemEntity({
                cMethod: CalculationMethodEnum.LABOR_MATERIAL,
                total: 555,
            });

            const result = service.normalizeREItemUpdateDto(entity, {
                cMethod: CalculationMethodEnum.LABOR_MATERIAL,
            });

            expect(result.total).toBe(555);
        });
    });

    describe('resolveREItem', () => {
        it('creates new items and updates existing ones, returning a success message', async () => {
            const section = makeSection();
            const existingEntity = makeItemEntity({ id: 'item-existing' });

            const data: ResolveREItemDto = {
                items: [
                    {
                        label: 'New',
                        cMethod: CalculationMethodEnum.TOTAL_UNIT,
                        laborValue: 1,
                        materialValue: 2,
                    } as UpdateREItemDto,
                    {
                        id: 'item-existing',
                        label: 'Updated',
                        cMethod: CalculationMethodEnum.TOTAL_UNIT,
                        laborValue: 5,
                        materialValue: 5,
                    } as UpdateREItemDto,
                ],
            } as ResolveREItemDto;

            mockRoomExpenseItemRepo.createMany.mockResolvedValue([]);
            mockRoomExpenseItemRepo.findOne.mockResolvedValue(existingEntity);
            mockRoomExpenseItemRepo.update.mockResolvedValue({ affected: 1 });

            const result = await service.resolveREItem(section, data);

            expect(mockRoomExpenseItemRepo.createMany).toHaveBeenCalledTimes(1);
            expect(mockRoomExpenseItemRepo.findOne).toHaveBeenCalledWith({
                where: { id: 'item-existing', roomSection: { id: section.id }, deleted: false },
            });
            expect(mockRoomExpenseItemRepo.update).toHaveBeenCalled();
            expect(result).toEqual({ message: 'Operation on items finished successfully' });
        });

        it('skips the update when findOne returns null (item not found in section)', async () => {
            const section = makeSection();

            const data: ResolveREItemDto = {
                items: [
                    {
                        id: 'ghost-id',
                        label: 'Ghost',
                        cMethod: CalculationMethodEnum.TOTAL_UNIT,
                        laborValue: 1,
                        materialValue: 1,
                    } as UpdateREItemDto,
                ],
            } as ResolveREItemDto;

            mockRoomExpenseItemRepo.createMany.mockResolvedValue([]);
            mockRoomExpenseItemRepo.findOne.mockResolvedValue(null);

            const result = await service.resolveREItem(section, data);

            expect(mockRoomExpenseItemRepo.update).not.toHaveBeenCalled();
            expect(result).toEqual({ message: 'Operation on items finished successfully' });
        });

        it('handles a data set with only creates (no updates)', async () => {
            const section = makeSection();

            const data: ResolveREItemDto = {
                items: [
                    {
                        label: 'Only Create',
                        cMethod: CalculationMethodEnum.TOTAL_UNIT,
                        laborValue: 2,
                        materialValue: 3,
                    } as UpdateREItemDto,
                ],
            } as ResolveREItemDto;

            mockRoomExpenseItemRepo.createMany.mockResolvedValue([]);

            const result = await service.resolveREItem(section, data);

            expect(mockRoomExpenseItemRepo.findOne).not.toHaveBeenCalled();
            expect(result).toEqual({ message: 'Operation on items finished successfully' });
        });

        it('handles an empty items array gracefully', async () => {
            const section = makeSection();
            const data: ResolveREItemDto = { items: [] } as ResolveREItemDto;

            mockRoomExpenseItemRepo.createMany.mockResolvedValue([]);

            const result = await service.resolveREItem(section, data);
            expect(result).toEqual({ message: 'Operation on items finished successfully' });
        });
    });
});
