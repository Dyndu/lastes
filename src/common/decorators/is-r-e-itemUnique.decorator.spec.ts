import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
    handleCreateItem,
    handleUpdateItem,
    IsREItemUnique,
    isUniqueREItem,
} from './is-r-e-itemUnique.decorator';
import { UpdateREItemDto } from '../../core/b-analysis/dto/update-r-e-item.dto';

class TestDto {
    @IsREItemUnique({ message: 'Expense items must be unique' })
    items?: UpdateREItemDto[];
}

const makeItem = (overrides: Partial<UpdateREItemDto> = {}): UpdateREItemDto =>
    plainToInstance(UpdateREItemDto, {
        label: 'Default Label',
        laborValue: 100,
        materialValue: 50,
        ...overrides,
    });

describe('handleUpdateItem', () => {
    it('should return true when item has no id', () => {
        const seen = new Set<string>();
        expect(handleUpdateItem(makeItem({ id: undefined }), seen)).toBe(true);
        expect(seen.size).toBe(0);
    });

    it('should return true and add id to set on first occurrence', () => {
        const seen = new Set<string>();
        expect(handleUpdateItem(makeItem({ id: 'uuid-1' }), seen)).toBe(true);
        expect(seen.has('uuid-1')).toBe(true);
    });

    it('should return false when id is already in set (duplicate)', () => {
        const seen = new Set<string>(['uuid-1']);
        expect(handleUpdateItem(makeItem({ id: 'uuid-1' }), seen)).toBe(false);
    });
});

describe('handleCreateItem', () => {
    it('should return true when item has no label', () => {
        const seen = new Set<string>();
        expect(handleCreateItem(makeItem({ label: undefined }), seen)).toBe(true);
        expect(seen.size).toBe(0);
    });

    it('should return true and add normalized label on first occurrence', () => {
        const seen = new Set<string>();
        expect(handleCreateItem(makeItem({ label: 'Roof Maintenance' }), seen)).toBe(true);
        expect(seen.has('roof maintenance')).toBe(true);
    });

    it('should return false when same label (case-insensitive) already seen', () => {
        const seen = new Set<string>(['roof maintenance']);
        expect(handleCreateItem(makeItem({ label: 'Roof Maintenance' }), seen)).toBe(false);
    });

    it('should return false when label differs only in casing', () => {
        const seen = new Set<string>();
        handleCreateItem(makeItem({ label: 'roof maintenance' }), seen);
        expect(handleCreateItem(makeItem({ label: 'ROOF MAINTENANCE' }), seen)).toBe(false);
    });

    it('should return false when label differs only in surrounding whitespace', () => {
        const seen = new Set<string>();
        handleCreateItem(makeItem({ label: 'roof maintenance' }), seen);
        expect(handleCreateItem(makeItem({ label: '  roof maintenance  ' }), seen)).toBe(false);
    });
});

describe('isUniqueREItem', () => {
    it('should route to handleUpdateItem when item has an id', () => {
        const seenIds = new Set<string>();
        const seenLabels = new Set<string>();
        expect(isUniqueREItem(makeItem({ id: 'uuid-1' }), seenIds, seenLabels)).toBe(true);
        expect(seenIds.has('uuid-1')).toBe(true);
        expect(seenLabels.size).toBe(0);
    });

    it('should route to handleCreateItem when item has no id', () => {
        const seenIds = new Set<string>();
        const seenLabels = new Set<string>();
        expect(
            isUniqueREItem(makeItem({ id: undefined, label: 'Roof' }), seenIds, seenLabels),
        ).toBe(true);
        expect(seenLabels.has('roof')).toBe(true);
        expect(seenIds.size).toBe(0);
    });

    it('should return false for duplicate id', () => {
        const seenIds = new Set<string>(['uuid-1']);
        const seenLabels = new Set<string>();
        expect(isUniqueREItem(makeItem({ id: 'uuid-1' }), seenIds, seenLabels)).toBe(false);
    });

    it('should return false for duplicate label', () => {
        const seenIds = new Set<string>();
        const seenLabels = new Set<string>(['roof']);
        expect(
            isUniqueREItem(makeItem({ id: undefined, label: 'Roof' }), seenIds, seenLabels),
        ).toBe(false);
    });
});

describe('IsREItemUnique decorator', () => {
    async function validateItems(items: unknown) {
        const dto = plainToInstance(TestDto, { items });
        return validate(dto);
    }

    it('should pass when items is not an array', async () => {
        const errors = await validateItems('not-an-array');
        expect(errors).toHaveLength(0);
    });

    it('should pass for an empty array', async () => {
        const errors = await validateItems([]);
        expect(errors).toHaveLength(0);
    });

    it('should pass for a single item without id', async () => {
        const errors = await validateItems([makeItem({ label: 'Roof' })]);
        expect(errors).toHaveLength(0);
    });

    it('should pass for a single item with id', async () => {
        const errors = await validateItems([makeItem({ id: 'uuid-1', label: 'Roof' })]);
        expect(errors).toHaveLength(0);
    });

    it('should pass for unique labels (create)', async () => {
        const errors = await validateItems([
            makeItem({ label: 'Roof' }),
            makeItem({ label: 'Floor' }),
        ]);
        expect(errors).toHaveLength(0);
    });

    it('should pass for unique ids (update)', async () => {
        const errors = await validateItems([
            makeItem({ id: 'uuid-1', label: 'Roof' }),
            makeItem({ id: 'uuid-2', label: 'Floor' }),
        ]);
        expect(errors).toHaveLength(0);
    });

    it('should pass for mixed create and update items', async () => {
        const errors = await validateItems([
            makeItem({ id: 'uuid-1', label: 'Roof' }),
            makeItem({ label: 'Floor' }),
        ]);
        expect(errors).toHaveLength(0);
    });

    it('should fail for duplicate labels (case-insensitive)', async () => {
        const errors = await validateItems([
            makeItem({ label: 'Roof Maintenance' }),
            makeItem({ label: 'roof maintenance' }),
        ]);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints?.isREItemUnique).toBe('Expense items must be unique');
    });

    it('should fail for duplicate labels differing only in whitespace', async () => {
        const errors = await validateItems([
            makeItem({ label: 'Roof' }),
            makeItem({ label: '  Roof  ' }),
        ]);
        expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail for duplicate ids', async () => {
        const errors = await validateItems([
            makeItem({ id: 'uuid-1', label: 'Roof' }),
            makeItem({ id: 'uuid-1', label: 'Floor' }),
        ]);
        expect(errors.length).toBeGreaterThan(0);
    });

    it('should use default message when no custom message provided', async () => {
        class NoMessageDto {
            @IsREItemUnique()
            items?: UpdateREItemDto[];
        }

        const dto = plainToInstance(NoMessageDto, {
            items: [makeItem({ label: 'Roof' }), makeItem({ label: 'Roof' })],
        });
        const errors = await validate(dto);
        expect(errors[0].constraints?.isREItemUnique).toBe(
            'items contains duplicate expense items',
        );
    });
});
