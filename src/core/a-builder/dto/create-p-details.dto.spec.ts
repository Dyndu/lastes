import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreatePDetailsDto } from './create-p-details.dto';
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

const validBase = {
    status: PropertyDetailsTypeEnum.SINGLE_FAMILY,
    units: [],
};

describe('CreatePDetailsDto', () => {
    const validate_ = async (plain: object) => {
        const dto = plainToInstance(CreatePDetailsDto, plain);
        return validate(dto);
    };

    it('should pass with a minimal valid object', async () => {
        const errors = await validate_(validBase);
        expect(errors).toHaveLength(0);
    });

    describe('status', () => {
        it('should fail when missing', async () => {
            const { status: _, ...rest } = validBase;
            const errors = await validate_(rest);
            expect(errors.find((e) => e.property === 'status')).toBeDefined();
        });

        it('should pass with SINGLE_FAMILY', async () => {
            const errors = await validate_({
                ...validBase,
                status: PropertyDetailsTypeEnum.SINGLE_FAMILY,
            });
            expect(errors.find((e) => e.property === 'status')).toBeUndefined();
        });

        it('should pass with MULTI_FAMILY', async () => {
            const errors = await validate_({
                ...validBase,
                status: PropertyDetailsTypeEnum.MULTI_FAMILY,
            });
            expect(errors.find((e) => e.property === 'status')).toBeUndefined();
        });

        it('should fail with an invalid enum value', async () => {
            const errors = await validate_({ ...validBase, status: 'INVALID' });
            expect(errors.find((e) => e.property === 'status')).toBeDefined();
        });
    });

    describe('monthlyIncome', () => {
        it('should pass when absent', async () => {
            const errors = await validate_(validBase);
            expect(errors.find((e) => e.property === 'monthlyIncome')).toBeUndefined();
        });

        it('should pass with a valid value', async () => {
            const errors = await validate_({ ...validBase, monthlyIncome: 3000 });
            expect(errors.find((e) => e.property === 'monthlyIncome')).toBeUndefined();
        });

        it('should pass with zero', async () => {
            const errors = await validate_({ ...validBase, monthlyIncome: 0 });
            expect(errors.find((e) => e.property === 'monthlyIncome')).toBeUndefined();
        });

        it('should fail with a negative value', async () => {
            const errors = await validate_({ ...validBase, monthlyIncome: -1 });
            expect(errors.find((e) => e.property === 'monthlyIncome')).toBeDefined();
        });

        it('should fail with a non-numeric value', async () => {
            const errors = await validate_({ ...validBase, monthlyIncome: 'abc' });
            expect(errors.find((e) => e.property === 'monthlyIncome')).toBeDefined();
        });
    });

    describe('units', () => {
        it('should pass with an empty array', async () => {
            const errors = await validate_({ ...validBase, units: [] });
            expect(errors.find((e) => e.property === 'units')).toBeUndefined();
        });

        it('should pass with a single valid unit', async () => {
            const errors = await validate_({ ...validBase, units: [validUnit] });
            expect(errors.find((e) => e.property === 'units')).toBeUndefined();
        });

        it('should pass with multiple valid units', async () => {
            const errors = await validate_({ ...validBase, units: [validUnit, validUnit] });
            expect(errors.find((e) => e.property === 'units')).toBeUndefined();
        });

        it('should fail when units is not an array', async () => {
            const errors = await validate_({ ...validBase, units: 'not-an-array' });
            expect(errors.find((e) => e.property === 'units')).toBeDefined();
        });

        it('should fail when a unit has an invalid field', async () => {
            const errors = await validate_({
                ...validBase,
                units: [{ ...validUnit, sqFootage: -1 }],
            });
            const unitsError = errors.find((e) => e.property === 'units');
            expect(unitsError?.children?.length).toBeGreaterThan(0);
        });

        it('should fail when a unit is missing a required field', async () => {
            const { sqFootage: _, ...unitWithoutSqFootage } = validUnit;
            const errors = await validate_({
                ...validBase,
                units: [unitWithoutSqFootage],
            });
            const unitsError = errors.find((e) => e.property === 'units');
            expect(unitsError?.children?.length).toBeGreaterThan(0);
        });
    });

    it('should pass with a fully valid object', async () => {
        const errors = await validate_({
            status: PropertyDetailsTypeEnum.MULTI_FAMILY,
            monthlyIncome: 5000,
            units: [validUnit, { ...validUnit, bedRooms: 1, monthlyRent: 900 }],
        });
        expect(errors).toHaveLength(0);
    });
});
