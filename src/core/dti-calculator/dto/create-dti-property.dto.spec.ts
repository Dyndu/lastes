import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateDtiPropertyDto } from './create-dti-property.dto';
import { PropertyDetailsTypeEnum } from '../../../common/enum';

const buildValid = (overrides: Partial<Record<string, any>> = {}): CreateDtiPropertyDto =>
    plainToInstance(CreateDtiPropertyDto, {
        streetAddress: 'Avenue Jean Paul II',
        city: 'Toronto',
        state: 'Ontario',
        zipCode: '12345',
        propertyType: PropertyDetailsTypeEnum.SINGLE_FAMILY,
        principalInterest: 299,
        taxesEscrow: 100,
        pMInsurance: 50,
        hoaFees: 75,
        monthlyRentalIncome: 1500,
        ...overrides,
    });

const getErrors = async (overrides: Partial<Record<string, any>> = {}) => {
    const dto = buildValid(overrides);
    return validate(dto);
};

const getFieldErrors = async (field: string, value: any) => {
    const errors = await getErrors({ [field]: value });
    return errors.filter((e) => e.property === field);
};

describe('CreateDtiPropertyDto', () => {
    it('passes validation with a fully valid payload', async () => {
        const errors = await getErrors();
        expect(errors).toHaveLength(0);
    });

    describe('streetAddress', () => {
        it('accepts a valid street address', async () => {
            expect(await getFieldErrors('streetAddress', 'Avenue Jean Paul II')).toHaveLength(0);
        });

        it('rejects when missing (empty string)', async () => {
            expect(await getFieldErrors('streetAddress', '')).not.toHaveLength(0);
        });

        it('rejects when below minLength of 4', async () => {
            expect(await getFieldErrors('streetAddress', 'Ave')).not.toHaveLength(0);
        });

        it('accepts exactly 4 characters', async () => {
            expect(await getFieldErrors('streetAddress', 'Ave!')).toHaveLength(0);
        });

        it('rejects a number value', async () => {
            expect(await getFieldErrors('streetAddress', 12345)).not.toHaveLength(0);
        });

        it('rejects null', async () => {
            expect(await getFieldErrors('streetAddress', null)).not.toHaveLength(0);
        });
    });

    describe('city', () => {
        it('accepts a valid city name', async () => {
            expect(await getFieldErrors('city', 'Toronto')).toHaveLength(0);
        });

        it('rejects when missing', async () => {
            expect(await getFieldErrors('city', '')).not.toHaveLength(0);
        });

        it('rejects below minLength of 3', async () => {
            expect(await getFieldErrors('city', 'TO')).not.toHaveLength(0);
        });

        it('accepts exactly 3 characters', async () => {
            expect(await getFieldErrors('city', 'NYC')).toHaveLength(0);
        });

        it('rejects a non-string value', async () => {
            expect(await getFieldErrors('city', 99)).not.toHaveLength(0);
        });
    });

    describe('state', () => {
        it('accepts a valid state', async () => {
            expect(await getFieldErrors('state', 'Ontario')).toHaveLength(0);
        });

        it('rejects when missing', async () => {
            expect(await getFieldErrors('state', '')).not.toHaveLength(0);
        });

        it('rejects below minLength of 3', async () => {
            expect(await getFieldErrors('state', 'ON')).not.toHaveLength(0);
        });

        it('accepts exactly 3 characters', async () => {
            expect(await getFieldErrors('state', 'Cal')).toHaveLength(0);
        });

        it('rejects a non-string value', async () => {
            expect(await getFieldErrors('state', true)).not.toHaveLength(0);
        });
    });

    describe('zipCode', () => {
        it('accepts a valid 5-digit ZIP code', async () => {
            expect(await getFieldErrors('zipCode', '12345')).toHaveLength(0);
        });

        it('accepts a valid ZIP+4 code', async () => {
            expect(await getFieldErrors('zipCode', '12345-6789')).toHaveLength(0);
        });

        it('rejects an invalid ZIP format', async () => {
            expect(await getFieldErrors('zipCode', '1234')).not.toHaveLength(0);
        });

        it('rejects letters', async () => {
            expect(await getFieldErrors('zipCode', 'ABCDE')).not.toHaveLength(0);
        });

        it('rejects a number (non-string)', async () => {
            expect(await getFieldErrors('zipCode', 12345)).not.toHaveLength(0);
        });

        it('rejects empty string', async () => {
            expect(await getFieldErrors('zipCode', '')).not.toHaveLength(0);
        });

        it('rejects null', async () => {
            expect(await getFieldErrors('zipCode', null)).not.toHaveLength(0);
        });
    });

    describe('propertyType', () => {
        it('accepts SINGLE_FAMILY', async () => {
            expect(
                await getFieldErrors('propertyType', PropertyDetailsTypeEnum.SINGLE_FAMILY),
            ).toHaveLength(0);
        });

        it('accepts MULTI_FAMILY', async () => {
            expect(
                await getFieldErrors('propertyType', PropertyDetailsTypeEnum.MULTI_FAMILY),
            ).toHaveLength(0);
        });

        it('rejects an invalid enum value', async () => {
            expect(await getFieldErrors('propertyType', 'CONDO')).not.toHaveLength(0);
        });

        it('rejects empty string', async () => {
            expect(await getFieldErrors('propertyType', '')).not.toHaveLength(0);
        });

        it('rejects null', async () => {
            expect(await getFieldErrors('propertyType', null)).not.toHaveLength(0);
        });
    });

    describe('principalInterest', () => {
        it('accepts a valid positive number', async () => {
            expect(await getFieldErrors('principalInterest', 299)).toHaveLength(0);
        });

        it('accepts 0', async () => {
            expect(await getFieldErrors('principalInterest', 0)).toHaveLength(0);
        });

        it('rejects a negative number', async () => {
            expect(await getFieldErrors('principalInterest', -1)).not.toHaveLength(0);
        });

        it('rejects a string', async () => {
            expect(await getFieldErrors('principalInterest', 'two hundred')).not.toHaveLength(0);
        });

        it('rejects null', async () => {
            expect(await getFieldErrors('principalInterest', null)).not.toHaveLength(0);
        });

        it('rejects NaN', async () => {
            expect(await getFieldErrors('principalInterest', NaN)).not.toHaveLength(0);
        });

        it('accepts a decimal with up to 2 decimal places', async () => {
            expect(await getFieldErrors('principalInterest', 299.99)).toHaveLength(0);
        });

        it('rejects more than 2 decimal places', async () => {
            expect(await getFieldErrors('principalInterest', 299.999)).not.toHaveLength(0);
        });
    });

    describe('taxesEscrow', () => {
        it('accepts a valid positive number', async () => {
            expect(await getFieldErrors('taxesEscrow', 100)).toHaveLength(0);
        });

        it('accepts 0', async () => {
            expect(await getFieldErrors('taxesEscrow', 0)).toHaveLength(0);
        });

        it('rejects a negative number', async () => {
            expect(await getFieldErrors('taxesEscrow', -10)).not.toHaveLength(0);
        });

        it('rejects null', async () => {
            expect(await getFieldErrors('taxesEscrow', null)).not.toHaveLength(0);
        });
    });

    describe('pMInsurance', () => {
        it('accepts a valid positive number', async () => {
            expect(await getFieldErrors('pMInsurance', 50)).toHaveLength(0);
        });

        it('accepts 0', async () => {
            expect(await getFieldErrors('pMInsurance', 0)).toHaveLength(0);
        });

        it('rejects a negative number', async () => {
            expect(await getFieldErrors('pMInsurance', -5)).not.toHaveLength(0);
        });

        it('rejects null', async () => {
            expect(await getFieldErrors('pMInsurance', null)).not.toHaveLength(0);
        });
    });

    describe('hoaFees', () => {
        it('accepts a valid positive number', async () => {
            expect(await getFieldErrors('hoaFees', 75)).toHaveLength(0);
        });

        it('accepts 0', async () => {
            expect(await getFieldErrors('hoaFees', 0)).toHaveLength(0);
        });

        it('rejects a negative number', async () => {
            expect(await getFieldErrors('hoaFees', -75)).not.toHaveLength(0);
        });

        it('rejects null', async () => {
            expect(await getFieldErrors('hoaFees', null)).not.toHaveLength(0);
        });
    });

    describe('monthlyRentalIncome', () => {
        it('accepts a valid positive number', async () => {
            expect(await getFieldErrors('monthlyRentalIncome', 1500)).toHaveLength(0);
        });

        it('accepts 0', async () => {
            expect(await getFieldErrors('monthlyRentalIncome', 0)).toHaveLength(0);
        });

        it('rejects a negative number', async () => {
            expect(await getFieldErrors('monthlyRentalIncome', -100)).not.toHaveLength(0);
        });

        it('rejects null', async () => {
            expect(await getFieldErrors('monthlyRentalIncome', null)).not.toHaveLength(0);
        });

        it('rejects a string', async () => {
            expect(await getFieldErrors('monthlyRentalIncome', 'fifteen hundred')).not.toHaveLength(
                0,
            );
        });
    });
});
