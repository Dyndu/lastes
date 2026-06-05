import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ResolveREItemDto } from './resolve-r-e-item.dto';
import { CalculationMethodEnum } from '../../../common/enum';

const validItem = {
    id: '2908dec0-a048-4a29-9810-e730e48a057b',
    label: 'Roof Maintenance',
    cMethod: CalculationMethodEnum.LABOR_MATERIAL,
    laborValue: 100,
    materialValue: 200,
};

const buildDto = (data: object) => plainToInstance(ResolveREItemDto, data);

describe('ResolveREItemDto', () => {
    describe('valid payload', () => {
        it('should pass with a single valid item', async () => {
            const dto = buildDto({ items: [validItem] });
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should pass with multiple valid unique items', async () => {
            const dto = buildDto({
                items: [
                    validItem,
                    { ...validItem, id: '3908dec0-a048-4a29-9810-e730e48a057b', label: 'Other' },
                ],
            });
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should pass when id is omitted (optional)', async () => {
            const { id, ...itemWithoutId } = validItem;
            const dto = buildDto({ items: [itemWithoutId] });
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });
    });

    describe('items — top-level validation', () => {
        it('should fail when items is missing', async () => {
            const dto = buildDto({});
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'items')).toBe(true);
        });

        it('should fail when items is empty array', async () => {
            const dto = buildDto({ items: [] });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'items')).toBe(true);
        });

        it('should fail when items is not an array', async () => {
            const dto = buildDto({ items: 'not-an-array' });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'items')).toBe(true);
        });

        it('should fail when items contains duplicate ids (@IsMRelationUnique)', async () => {
            const dto = buildDto({ items: [validItem, validItem] });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'items')).toBe(true);
        });
    });

    describe('nested item — id', () => {
        it('should fail when id is not a valid UUID', async () => {
            const dto = buildDto({ items: [{ ...validItem, id: 'not-a-uuid' }] });
            const errors = await validate(dto, { whitelist: true });
            const nestedErrors = errors.find((e) => e.property === 'items')?.children;
            expect(nestedErrors?.length).toBeGreaterThan(0);
        });
    });

    describe('nested item — label', () => {
        it('should fail when label is missing', async () => {
            const { label, ...withoutLabel } = validItem;
            const dto = buildDto({ items: [withoutLabel] });
            const errors = await validate(dto);
            const nestedErrors = errors.find((e) => e.property === 'items')?.children;
            expect(nestedErrors?.length).toBeGreaterThan(0);
        });

        it('should fail when label is too short (< 2 chars)', async () => {
            const dto = buildDto({ items: [{ ...validItem, label: 'A' }] });
            const errors = await validate(dto);
            const nestedErrors = errors.find((e) => e.property === 'items')?.children;
            expect(nestedErrors?.length).toBeGreaterThan(0);
        });

        it('should fail when label is not a string', async () => {
            const dto = buildDto({ items: [{ ...validItem, label: 123 }] });
            const errors = await validate(dto);
            const nestedErrors = errors.find((e) => e.property === 'items')?.children;
            expect(nestedErrors?.length).toBeGreaterThan(0);
        });
    });

    describe('nested item — cMethod', () => {
        it('should fail when cMethod is missing', async () => {
            const { cMethod, ...withoutCMethod } = validItem;
            const dto = buildDto({ items: [withoutCMethod] });
            const errors = await validate(dto);
            const nestedErrors = errors.find((e) => e.property === 'items')?.children;
            expect(nestedErrors?.length).toBeGreaterThan(0);
        });

        it('should fail when cMethod is not a valid enum value', async () => {
            const dto = buildDto({ items: [{ ...validItem, cMethod: 'invalid_method' }] });
            const errors = await validate(dto);
            const nestedErrors = errors.find((e) => e.property === 'items')?.children;
            expect(nestedErrors?.length).toBeGreaterThan(0);
        });

        it('should pass with each valid CalculationMethodEnum value', async () => {
            for (const method of Object.values(CalculationMethodEnum)) {
                const dto = buildDto({ items: [{ ...validItem, cMethod: method }] });
                const errors = await validate(dto);
                expect(errors).toHaveLength(0);
            }
        });
    });

    describe('nested item — laborValue', () => {
        it('should fail when laborValue is missing', async () => {
            const { laborValue, ...withoutLaborValue } = validItem;
            const dto = buildDto({ items: [withoutLaborValue] });
            const errors = await validate(dto);
            const nestedErrors = errors.find((e) => e.property === 'items')?.children;
            expect(nestedErrors?.length).toBeGreaterThan(0);
        });

        it('should fail when laborValue is negative', async () => {
            const dto = buildDto({ items: [{ ...validItem, laborValue: -1 }] });
            const errors = await validate(dto);
            const nestedErrors = errors.find((e) => e.property === 'items')?.children;
            expect(nestedErrors?.length).toBeGreaterThan(0);
        });

        it('should fail when laborValue is not a number', async () => {
            const dto = buildDto({ items: [{ ...validItem, laborValue: 'abc' }] });
            const errors = await validate(dto);
            const nestedErrors = errors.find((e) => e.property === 'items')?.children;
            expect(nestedErrors?.length).toBeGreaterThan(0);
        });

        it('should pass when laborValue is 0', async () => {
            const dto = buildDto({ items: [{ ...validItem, laborValue: 0 }] });
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });
    });

    describe('nested item — materialValue', () => {
        it('should fail when materialValue is missing', async () => {
            const { materialValue, ...withoutMaterialValue } = validItem;
            const dto = buildDto({ items: [withoutMaterialValue] });
            const errors = await validate(dto);
            const nestedErrors = errors.find((e) => e.property === 'items')?.children;
            expect(nestedErrors?.length).toBeGreaterThan(0);
        });

        it('should fail when materialValue is negative', async () => {
            const dto = buildDto({ items: [{ ...validItem, materialValue: -5 }] });
            const errors = await validate(dto);
            const nestedErrors = errors.find((e) => e.property === 'items')?.children;
            expect(nestedErrors?.length).toBeGreaterThan(0);
        });

        it('should fail when materialValue is not a number', async () => {
            const dto = buildDto({ items: [{ ...validItem, materialValue: true }] });
            const errors = await validate(dto);
            const nestedErrors = errors.find((e) => e.property === 'items')?.children;
            expect(nestedErrors?.length).toBeGreaterThan(0);
        });

        it('should pass when materialValue is 0', async () => {
            const dto = buildDto({ items: [{ ...validItem, materialValue: 0 }] });
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });
    });

    describe('nested item — total', () => {
        it('should pass when total is omitted', async () => {
            const { ...itemWithoutTotal } = validItem;
            const dto = buildDto({ items: [itemWithoutTotal] });
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should pass when total is a valid positive number', async () => {
            const dto = buildDto({ items: [{ ...validItem, total: 200 }] });
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should pass when total is 0', async () => {
            const dto = buildDto({ items: [{ ...validItem, total: 0 }] });
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should pass when total is a positive decimal with up to 2 places', async () => {
            const dto = buildDto({ items: [{ ...validItem, total: 99.99 }] });
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should fail when total is negative', async () => {
            const dto = buildDto({ items: [{ ...validItem, total: -1 }] });
            const errors = await validate(dto);
            const nestedErrors = errors.find((e) => e.property === 'items')?.children;
            expect(nestedErrors?.length).toBeGreaterThan(0);
        });

        it('should fail when total is NaN', async () => {
            const dto = buildDto({ items: [{ ...validItem, total: NaN }] });
            const errors = await validate(dto);
            const nestedErrors = errors.find((e) => e.property === 'items')?.children;
            expect(nestedErrors?.length).toBeGreaterThan(0);
        });

        it('should fail when total is a string', async () => {
            const dto = buildDto({ items: [{ ...validItem, total: 'abc' }] });
            const errors = await validate(dto);
            const nestedErrors = errors.find((e) => e.property === 'items')?.children;
            expect(nestedErrors?.length).toBeGreaterThan(0);
        });

        it('should fail when total has more than 2 decimal places', async () => {
            const dto = buildDto({ items: [{ ...validItem, total: 99.999 }] });
            const errors = await validate(dto);
            const nestedErrors = errors.find((e) => e.property === 'items')?.children;
            expect(nestedErrors?.length).toBeGreaterThan(0);
        });
    });
});
