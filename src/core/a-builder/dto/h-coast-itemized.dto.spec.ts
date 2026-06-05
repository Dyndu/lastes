import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { HCoastItemizedDto } from './h-coast-itemized.dto';

const makeValidDto = (): Record<string, unknown> => ({
    electricity: 100,
    water: 200,
    gas: 50,
    insurance: 80,
    trash: 30,
    propertyTaxes: 1200,
    other: 75,
});

const validateDto = async (plain: Record<string, unknown>) => {
    const instance = plainToInstance(HCoastItemizedDto, plain);
    return validate(instance);
};

describe('HCoastItemizedDto', () => {
    describe('instantiation', () => {
        it('should create an instance', () => {
            expect(new HCoastItemizedDto()).toBeInstanceOf(HCoastItemizedDto);
        });

        it('should have all fields undefined by default', () => {
            const dto = new HCoastItemizedDto();
            expect(dto.electricity).toBeUndefined();
            expect(dto.water).toBeUndefined();
            expect(dto.gas).toBeUndefined();
            expect(dto.insurance).toBeUndefined();
            expect(dto.trash).toBeUndefined();
            expect(dto.propertyTaxes).toBeUndefined();
            expect(dto.other).toBeUndefined();
        });
    });

    describe('field assignment', () => {
        it('should assign all fields correctly', () => {
            const dto = plainToInstance(HCoastItemizedDto, makeValidDto());
            expect(dto.electricity).toBe(100);
            expect(dto.water).toBe(200);
            expect(dto.gas).toBe(50);
            expect(dto.insurance).toBe(80);
            expect(dto.trash).toBe(30);
            expect(dto.propertyTaxes).toBe(1200);
            expect(dto.other).toBe(75);
        });
    });

    describe('valid payload', () => {
        it('should pass validation with all required fields and valid values', async () => {
            const errors = await validateDto(makeValidDto());
            expect(errors).toHaveLength(0);
        });

        it('should pass validation when propertyTaxes is omitted (optional)', async () => {
            const { propertyTaxes, ...rest } = makeValidDto();
            const errors = await validateDto(rest);
            expect(errors).toHaveLength(0);
        });

        it('should pass validation with zero values (min = 0)', async () => {
            const errors = await validateDto({
                electricity: 0,
                water: 0,
                gas: 0,
                insurance: 0,
                trash: 0,
                propertyTaxes: 0,
                other: 0,
            });
            expect(errors).toHaveLength(0);
        });

        it('should pass validation with decimal values (up to 2 decimal places)', async () => {
            const errors = await validateDto({
                ...makeValidDto(),
                electricity: 99.99,
                water: 0.01,
            });
            expect(errors).toHaveLength(0);
        });
    });

    describe('required fields', () => {
        const requiredFields = [
            'electricity',
            'water',
            'gas',
            'insurance',
            'trash',
            'other',
        ] as const;

        requiredFields.forEach((field) => {
            it(`should fail validation when "${field}" is missing`, async () => {
                const dto = { ...makeValidDto() };
                delete dto[field];
                const errors = await validateDto(dto);
                expect(errors.some((e) => e.property === field)).toBe(true);
            });
        });
    });

    describe('numeric type validation', () => {
        const fields = ['electricity', 'water', 'gas', 'insurance', 'trash', 'other'] as const;

        fields.forEach((field) => {
            it(`should fail validation when "${field}" is a string`, async () => {
                const errors = await validateDto({ ...makeValidDto(), [field]: 'not-a-number' });
                expect(errors.some((e) => e.property === field)).toBe(true);
            });
        });

        it('should fail validation when propertyTaxes is a string', async () => {
            const errors = await validateDto({ ...makeValidDto(), propertyTaxes: 'not-a-number' });
            expect(errors.some((e) => e.property === 'propertyTaxes')).toBe(true);
        });
    });

    describe('minimum value constraint', () => {
        const fields = ['electricity', 'water', 'gas', 'insurance', 'trash', 'other'] as const;

        fields.forEach((field) => {
            it(`should fail validation when "${field}" is negative`, async () => {
                const errors = await validateDto({ ...makeValidDto(), [field]: -1 });
                expect(errors.some((e) => e.property === field)).toBe(true);
            });
        });

        it('should fail validation when propertyTaxes is negative', async () => {
            const errors = await validateDto({ ...makeValidDto(), propertyTaxes: -0.01 });
            expect(errors.some((e) => e.property === 'propertyTaxes')).toBe(true);
        });
    });
});
