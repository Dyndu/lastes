import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateRepairsDto } from './update-repairs.dto';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

const validRItem = {
    roof: 1000,
    landscaping: 500,
    concierge: 300,
    garage: 800,
    bathrooms: 600,
};

describe('UpdateRepairsDto', () => {
    const validate_ = async (plain: object) => {
        const dto = plainToInstance(UpdateRepairsDto, plain);
        return validate(dto);
    };

    it('should pass with an empty object (all fields optional)', async () => {
        const errors = await validate_({});
        expect(errors).toHaveLength(0);
    });

    it('should pass with a fully valid object', async () => {
        const errors = await validate_({
            total: 10000,
            eRepairs: validRItem,
            iRepairs: validRItem,
            oRepairs: validRItem,
        });
        expect(errors).toHaveLength(0);
    });

    describe('total', () => {
        it('should pass when absent', async () => {
            const errors = await validate_({});
            expect(errors.find((e) => e.property === 'total')).toBeUndefined();
        });

        it('should pass with a valid value', async () => {
            const errors = await validate_({ total: 5000 });
            expect(errors.find((e) => e.property === 'total')).toBeUndefined();
        });

        it('should pass with zero', async () => {
            const errors = await validate_({ total: 0 });
            expect(errors.find((e) => e.property === 'total')).toBeUndefined();
        });

        it('should fail with a non-numeric value', async () => {
            const errors = await validate_({ total: 'abc' });
            expect(errors.find((e) => e.property === 'total')).toBeDefined();
        });
    });

    const nestedFields = ['eRepairs', 'iRepairs', 'oRepairs'];

    describe.each(nestedFields)('%s', (field) => {
        it('should pass when absent', async () => {
            const errors = await validate_({});
            expect(errors.find((e) => e.property === field)).toBeUndefined();
        });

        it('should pass with a valid nested object', async () => {
            const errors = await validate_({ [field]: validRItem });
            expect(errors.find((e) => e.property === field)).toBeUndefined();
        });

        it('should fail when nested object has a negative value', async () => {
            const errors = await validate_({ [field]: { ...validRItem, roof: -1 } });
            const fieldError = errors.find((e) => e.property === field);
            expect(fieldError?.children?.length).toBeGreaterThan(0);
        });

        it('should fail when nested object is missing a required field', async () => {
            const { roof: _, ...itemWithoutRoof } = validRItem;
            const errors = await validate_({ [field]: itemWithoutRoof });
            const fieldError = errors.find((e) => e.property === field);
            expect(fieldError?.children?.length).toBeGreaterThan(0);
        });
    });
});
