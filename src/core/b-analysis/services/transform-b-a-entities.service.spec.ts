import { Test, TestingModule } from '@nestjs/testing';
import { RoomCategoryEntity, RoomExpenseItemEntity, RoomSectionEntity } from '../entities';
import { CalculationMethodEnum, BAnalysisTypeEnum } from '../../../common/enum';
import { TransformBAEntitiesService } from './transform-b-a-entities.service';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

const makeREItem = (overrides: Partial<RoomExpenseItemEntity> = {}): RoomExpenseItemEntity =>
    Object.assign(new RoomExpenseItemEntity(), {
        id: 'item-1',
        label: 'Roof Maintenance',
        cMethod: CalculationMethodEnum.LABOR_MATERIAL,
        laborValue: 100,
        materialValue: 50,
        total: 5,
        ...overrides,
    });

const makeRoomSection = (overrides: Partial<RoomSectionEntity> = {}): RoomSectionEntity =>
    Object.assign(new RoomSectionEntity(), {
        id: 'section-1',
        label: 'Roof',
        expenses: [],
        ...overrides,
    });

const makeRoomCategory = (overrides: Partial<RoomCategoryEntity> = {}): RoomCategoryEntity =>
    Object.assign(new RoomCategoryEntity(), {
        id: 'room-1',
        label: 'Room 1',
        type: BAnalysisTypeEnum.EXTERIOR_EXPENSES,
        sections: [],
        ...overrides,
    });

describe('TransformBAEntitiesService', () => {
    let service: TransformBAEntitiesService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [TransformBAEntitiesService],
        }).compile();

        service = module.get<TransformBAEntitiesService>(TransformBAEntitiesService);
    });

    describe('transformREItem', () => {
        it('should return only the essential fields of a RoomExpenseItemEntity', () => {
            const item = makeREItem();
            const result = service.transformREItem(item);

            expect(result).toEqual({
                id: 'item-1',
                label: 'Roof Maintenance',
                cMethod: CalculationMethodEnum.LABOR_MATERIAL,
                laborValue: 100,
                materialValue: 50,
                total: 5,
            });
        });

        it('should not include extra fields from the entity', () => {
            const item = makeREItem();
            const result = service.transformREItem(item);

            expect(result).not.toHaveProperty('deleted');
            expect(result).not.toHaveProperty('roomSection');
        });
    });

    describe('transformREItems', () => {
        it('should transform an array of RoomExpenseItemEntity', () => {
            const items = [
                makeREItem({ id: 'item-1', label: 'Roof' }),
                makeREItem({ id: 'item-2', label: 'Floor' }),
            ];
            const result = service.transformREItems(items);

            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('item-1');
            expect(result[1].id).toBe('item-2');
        });

        it('should return an empty array when input is empty', () => {
            expect(service.transformREItems([])).toEqual([]);
        });
    });

    describe('transformRoomSection', () => {
        it('should return only id and label', () => {
            const section = makeRoomSection();
            const result = service.transformRoomSection(section);

            expect(result).toEqual({ id: 'section-1', label: 'Roof' });
        });

        it('should not include expenses or other fields', () => {
            const result = service.transformRoomSection(makeRoomSection());
            expect(result).not.toHaveProperty('expenses');
            expect(result).not.toHaveProperty('deleted');
        });
    });

    describe('transformRoomSections', () => {
        it('should transform an array of RoomSectionEntity', () => {
            const sections = [
                makeRoomSection({ id: 'section-1', label: 'Roof' }),
                makeRoomSection({ id: 'section-2', label: 'Floor' }),
            ];
            const result = service.transformRoomSections(sections);

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({ id: 'section-1', label: 'Roof' });
            expect(result[1]).toEqual({ id: 'section-2', label: 'Floor' });
        });

        it('should return an empty array when input is empty', () => {
            expect(service.transformRoomSections([])).toEqual([]);
        });
    });

    describe('transformRSection', () => {
        it('should return id, label and expenses when expenses exist', () => {
            const expenses = [makeREItem({ id: 'item-1' }), makeREItem({ id: 'item-2' })];
            const section = makeRoomSection({ expenses });
            const result = service.transformRSection(section);

            expect(result.id).toBe('section-1');
            expect(result.label).toBe('Roof');
            expect(result.expenses).toHaveLength(2);
            expect(result.expenses[0].id).toBe('item-1');
            expect(result.expenses[1].id).toBe('item-2');
        });

        it('should return empty expenses array when expenses is empty', () => {
            const section = makeRoomSection({ expenses: [] });
            const result = service.transformRSection(section);

            expect(result.expenses).toEqual([]);
        });

        it('should return empty expenses array when expenses is undefined', () => {
            const section = makeRoomSection({ expenses: undefined });
            const result = service.transformRSection(section);

            expect(result.expenses).toEqual([]);
        });
    });

    describe('transformRoom', () => {
        it('should return only id, label and type', () => {
            const room = makeRoomCategory();
            const result = service.transformRoom(room);

            expect(result).toEqual({
                id: 'room-1',
                label: 'Room 1',
                type: BAnalysisTypeEnum.EXTERIOR_EXPENSES,
            });
        });

        it('should not include sections or other fields', () => {
            const result = service.transformRoom(makeRoomCategory());
            expect(result).not.toHaveProperty('sections');
            expect(result).not.toHaveProperty('deleted');
        });
    });

    describe('transformRooms', () => {
        it('should transform an array of RoomCategoryEntity', () => {
            const rooms = [
                makeRoomCategory({ id: 'room-1', label: 'Room 1' }),
                makeRoomCategory({ id: 'room-2', label: 'Room 2' }),
            ];
            const result = service.transformRooms(rooms);

            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('room-1');
            expect(result[1].id).toBe('room-2');
        });

        it('should return an empty array when input is empty', () => {
            expect(service.transformRooms([])).toEqual([]);
        });
    });

    describe('transformRCategory', () => {
        it('should return id, label, type and sections when sections exist', () => {
            const sections = [
                makeRoomSection({ id: 'section-1', label: 'Roof' }),
                makeRoomSection({ id: 'section-2', label: 'Floor' }),
            ];
            const room = makeRoomCategory({ sections });
            const result = service.transformRCategory(room);

            expect(result.id).toBe('room-1');
            expect(result.label).toBe('Room 1');
            expect(result.type).toBe(BAnalysisTypeEnum.EXTERIOR_EXPENSES);
            expect(result.sections).toHaveLength(2);
            expect(result.sections[0]).toEqual({ id: 'section-1', label: 'Roof' });
            expect(result.sections[1]).toEqual({ id: 'section-2', label: 'Floor' });
        });

        it('should return empty sections array when sections is empty', () => {
            const result = service.transformRCategory(makeRoomCategory({ sections: [] }));
            expect(result.sections).toEqual([]);
        });

        it('should return empty sections array when sections is undefined', () => {
            const result = service.transformRCategory(makeRoomCategory({ sections: undefined }));
            expect(result.sections).toEqual([]);
        });
    });

    describe('transformRCategories', () => {
        it('should transform an array of RoomCategoryEntity with sections', () => {
            const rooms = [
                makeRoomCategory({ id: 'room-1', sections: [makeRoomSection()] }),
                makeRoomCategory({ id: 'room-2', sections: [] }),
            ];
            const result = service.transformRCategories(rooms);

            expect(result).toHaveLength(2);
            expect(result[0].sections).toHaveLength(1);
            expect(result[1].sections).toEqual([]);
        });

        it('should return an empty array when input is empty', () => {
            expect(service.transformRCategories([])).toEqual([]);
        });
    });
});
