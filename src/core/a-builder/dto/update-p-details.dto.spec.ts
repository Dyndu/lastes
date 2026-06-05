import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdatePDetailsDto } from './update-p-details.dto';
import { PropertyDetailsTypeEnum } from '../../../common/enum';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

const validUnit = {
    sqFootage: 1200,
    bedRooms: 3,
    bathRooms: 2,
    monthlyRent: 1500,
};

describe('UpdatePDetailsDto', () => {
    const validate_ = async (plain: object) => {
        const dto = plainToInstance(UpdatePDetailsDto, plain);
        return validate(dto);
    };

    it('should pass with an empty object (all fields optional)', async () => {
        const errors = await validate_({});
        expect(errors).toHaveLength(0);
    });

    it('should pass with a fully valid object', async () => {
        const errors = await validate_({
            status: PropertyDetailsTypeEnum.MULTI_FAMILY,
            monthlyIncome: 5000,
            units: [validUnit],
        });
        expect(errors).toHaveLength(0);
    });

    describe('status', () => {
        it('should pass when absent', async () => {
            const errors = await validate_({});
            expect(errors.find((e) => e.property === 'status')).toBeUndefined();
        });

        it('should pass with a valid enum value', async () => {
            const errors = await validate_({ status: PropertyDetailsTypeEnum.SINGLE_FAMILY });
            expect(errors.find((e) => e.property === 'status')).toBeUndefined();
        });

        it('should fail with an invalid enum value', async () => {
            const errors = await validate_({ status: 'INVALID' });
            expect(errors.find((e) => e.property === 'status')).toBeDefined();
        });
    });

    describe('monthlyIncome', () => {
        it('should pass when absent', async () => {
            const errors = await validate_({});
            expect(errors.find((e) => e.property === 'monthlyIncome')).toBeUndefined();
        });

        it('should pass with a valid value', async () => {
            const errors = await validate_({ monthlyIncome: 3000 });
            expect(errors.find((e) => e.property === 'monthlyIncome')).toBeUndefined();
        });

        it('should pass with zero', async () => {
            const errors = await validate_({ monthlyIncome: 0 });
            expect(errors.find((e) => e.property === 'monthlyIncome')).toBeUndefined();
        });

        it('should fail with a negative value', async () => {
            const errors = await validate_({ monthlyIncome: -1 });
            expect(errors.find((e) => e.property === 'monthlyIncome')).toBeDefined();
        });

        it('should fail with a non-numeric value', async () => {
            const errors = await validate_({ monthlyIncome: 'abc' });
            expect(errors.find((e) => e.property === 'monthlyIncome')).toBeDefined();
        });
    });

    describe('units', () => {
        it('should pass when absent', async () => {
            const errors = await validate_({});
            expect(errors.find((e) => e.property === 'units')).toBeUndefined();
        });

        it('should pass with an empty array', async () => {
            const errors = await validate_({ units: [] });
            expect(errors.find((e) => e.property === 'units')).toBeUndefined();
        });

        it('should pass with a valid unit', async () => {
            const errors = await validate_({ units: [validUnit] });
            expect(errors.find((e) => e.property === 'units')).toBeUndefined();
        });

        it('should fail when units is not an array', async () => {
            const errors = await validate_({ units: 'not-an-array' });
            expect(errors.find((e) => e.property === 'units')).toBeDefined();
        });

        it('should fail when a unit has an invalid field', async () => {
            const errors = await validate_({ units: [{ ...validUnit, sqFootage: -1 }] });
            const unitsError = errors.find((e) => e.property === 'units');
            expect(unitsError?.children?.length).toBeGreaterThan(0);
        });

        it('should fail when a unit is missing a required field', async () => {
            const { sqFootage: _, ...unitWithoutSqFootage } = validUnit;
            const errors = await validate_({ units: [unitWithoutSqFootage] });
            const unitsError = errors.find((e) => e.property === 'units');
            expect(unitsError?.children?.length).toBeGreaterThan(0);
        });
    });
});
