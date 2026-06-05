import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { HCoastDto } from './h-coast.dto';
import { HCoastItemizedDto } from './h-coast-itemized.dto';

const makeValidItem = () => ({
    electricity: 100,
    water: 80,
    gas: 60,
    trash: 20,
    propertyTaxes: 500,
    others: 30,
});

const makeValidDto = (): Record<string, unknown> => ({
    duration: 12,
    pIValue: 2300,
    hasItems: true,
});

const validateDto = async (plain: Record<string, unknown>) => {
    const instance = plainToInstance(HCoastDto, plain);
    return validate(instance);
};

describe('HCoastDto', () => {
    describe('instantiation', () => {
        it('should create an instance', () => {
            expect(new HCoastDto()).toBeInstanceOf(HCoastDto);
        });

        it('should have all fields undefined by default', () => {
            const dto = new HCoastDto();
            expect(dto.duration).toBeUndefined();
            expect(dto.pIValue).toBeUndefined();
            expect(dto.hasItems).toBeUndefined();
            expect(dto.holdingCoast).toBeUndefined();
            expect(dto.item).toBeUndefined();
        });
    });

    describe('field assignment', () => {
        it('should assign all fields correctly', () => {
            const dto = plainToInstance(HCoastDto, {
                ...makeValidDto(),
                holdingCoast: 200,
                item: makeValidItem(),
            });

            expect(dto.duration).toBe(12);
            expect(dto.pIValue).toBe(2300);
            expect(dto.hasItems).toBe(true);
            expect(dto.holdingCoast).toBe(200);
            expect(dto.item).toBeDefined();
        });
    });

    describe('valid payload', () => {
        it('should pass with only required fields', async () => {
            const errors = await validateDto(makeValidDto());
            expect(errors).toHaveLength(0);
        });

        it('should pass when optional holdingCoast is provided', async () => {
            const errors = await validateDto({ ...makeValidDto(), holdingCoast: 300 });
            expect(errors).toHaveLength(0);
        });

        it('should pass when optional holdingCoast is omitted', async () => {
            const { ...dto } = makeValidDto();
            const errors = await validateDto(dto);
            expect(errors).toHaveLength(0);
        });

        it('should pass when optional item is omitted', async () => {
            const errors = await validateDto(makeValidDto());
            expect(errors).toHaveLength(0);
        });

        it('should pass with hasItems = false', async () => {
            const errors = await validateDto({ ...makeValidDto(), hasItems: false });
            expect(errors).toHaveLength(0);
        });

        it('should pass with zero values for numeric fields', async () => {
            const errors = await validateDto({ duration: 1, pIValue: 2300, hasItems: true });
            expect(errors).toHaveLength(0);
        });

        it('should fail if pIValue is out of range', async () => {
            const errors = await validateDto({ ...makeValidDto(), pIValue: 1500 });
            expect(errors).toHaveLength(1);
        });

        it('should pass with pIValue at min', async () => {
            const errors = await validateDto({ ...makeValidDto(), pIValue: 2300 });
            expect(errors).toHaveLength(0);
        });

        it('should pass with pIValue at max', async () => {
            const errors = await validateDto({ ...makeValidDto(), pIValue: 2301 });
            expect(errors).toHaveLength(0);
        });
    });

    describe('required fields', () => {
        (['duration', 'pIValue', 'hasItems'] as const).forEach((field) => {
            it(`should fail when "${field}" is missing`, async () => {
                const dto = { ...makeValidDto() };
                delete (dto as any)[field];
                const errors = await validateDto(dto);
                expect(errors.some((e) => e.property === field)).toBe(true);
            });
        });
    });

    describe('numeric type validation', () => {
        (['duration', 'pIValue'] as const).forEach((field) => {
            it(`should fail when "${field}" is a string`, async () => {
                const errors = await validateDto({ ...makeValidDto(), [field]: 'not-a-number' });
                expect(errors.some((e) => e.property === field)).toBe(true);
            });
        });

        it('should fail when holdingCoast is a string', async () => {
            const errors = await validateDto({ ...makeValidDto(), holdingCoast: 'bad' });
            expect(errors.some((e) => e.property === 'holdingCoast')).toBe(true);
        });
    });

    describe('minimum value constraint', () => {
        (['duration', 'pIValue'] as const).forEach((field) => {
            it(`should fail when "${field}" is negative`, async () => {
                const errors = await validateDto({ ...makeValidDto(), [field]: -1 });
                expect(errors.some((e) => e.property === field)).toBe(true);
            });
        });

        it('should fail when holdingCoast is negative', async () => {
            const errors = await validateDto({ ...makeValidDto(), holdingCoast: -5 });
            expect(errors.some((e) => e.property === 'holdingCoast')).toBe(true);
        });
    });

    describe('boolean validation', () => {
        it('should fail when hasItems is a number', async () => {
            const errors = await validateDto({ ...makeValidDto(), hasItems: 1 });
            expect(errors.some((e) => e.property === 'hasItems')).toBe(true);
        });

        it('should fail when hasItems is a string', async () => {
            const errors = await validateDto({ ...makeValidDto(), hasItems: 'yes' });
            expect(errors.some((e) => e.property === 'hasItems')).toBe(true);
        });
    });

    describe('nested item validation', () => {
        it('should fail when item is provided with an invalid nested field', async () => {
            const errors = await validateDto({
                ...makeValidDto(),
                item: { ...makeValidItem(), electricity: -50 },
            });
            expect(errors.some((e) => e.property === 'item')).toBe(true);
        });

        it('should fail when item is provided with a missing required nested field', async () => {
            const { electricity, ...itemWithoutElectricity } = makeValidItem();
            const errors = await validateDto({
                ...makeValidDto(),
                item: itemWithoutElectricity,
            });
            expect(errors.some((e) => e.property === 'item')).toBe(true);
        });

        it('should correctly transform item into an HCoastItemizedDto instance', () => {
            const instance = plainToInstance(HCoastDto, {
                ...makeValidDto(),
                item: makeValidItem(),
            });
            expect(instance.item).toBeInstanceOf(HCoastItemizedDto);
        });
    });
});
