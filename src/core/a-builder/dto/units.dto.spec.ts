import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UnitsDto } from './units.dto';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

const validBase: Record<string, number> = {
    sqFootage: 1200,
    bedRooms: 3,
    bathRooms: 2,
    monthlyRent: 1500,
};

describe('UnitsDto', () => {
    const validate_ = async (plain: object) => {
        const dto = plainToInstance(UnitsDto, plain);
        return validate(dto);
    };

    it('should pass with all valid fields', async () => {
        const errors = await validate_(validBase);
        expect(errors).toHaveLength(0);
    });

    const requiredFields = ['sqFootage', 'bedRooms', 'bathRooms', 'monthlyRent'];

    describe.each(requiredFields)('%s', (field) => {
        it('should fail when missing', async () => {
            const { [field]: _, ...rest } = validBase;
            const errors = await validate_(rest);
            expect(errors.find((e) => e.property === field)).toBeDefined();
        });

        it('should fail with a negative value', async () => {
            const errors = await validate_({ ...validBase, [field]: -1 });
            expect(errors.find((e) => e.property === field)).toBeDefined();
        });

        it('should fail with a non-numeric value', async () => {
            const errors = await validate_({ ...validBase, [field]: 'abc' });
            expect(errors.find((e) => e.property === field)).toBeDefined();
        });

        it('should pass with zero', async () => {
            const errors = await validate_({ ...validBase, [field]: 0 });
            expect(errors.find((e) => e.property === field)).toBeUndefined();
        });
    });
});
