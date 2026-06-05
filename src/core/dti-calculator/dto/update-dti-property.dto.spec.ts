import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateDtiPropertyDto } from './update-dti-property.dto';
import { PropertyDetailsTypeEnum } from '../../../common/enum';

const buildDto = (data: Partial<Record<string, any>> = {}): UpdateDtiPropertyDto =>
    plainToInstance(UpdateDtiPropertyDto, data);

const getErrors = async (data: Partial<Record<string, any>> = {}) => validate(buildDto(data));

const getFieldErrors = async (field: string, value: any, rest: Record<string, any> = {}) => {
    const errors = await getErrors({ [field]: value, ...rest });
    return errors.filter((e) => e.property === field);
};

const fullValid = {
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
};

describe('UpdateDtiPropertyDto', () => {
    it('passes validation with an empty object (all fields are optional via PartialType)', async () => {
        const errors = await getErrors({});
        expect(errors).toHaveLength(0);
    });

    it('passes validation with a fully valid payload including monthlyRent', async () => {
        const errors = await getErrors({ ...fullValid, monthlyRent: 2300 });
        expect(errors).toHaveLength(0);
    });

    it('passes validation with a fully valid payload without monthlyRent', async () => {
        const errors = await getErrors({ ...fullValid });
        expect(errors).toHaveLength(0);
    });

    describe('monthlyRent', () => {
        it('accepts a valid positive number', async () => {
            expect(await getFieldErrors('monthlyRent', 2300)).toHaveLength(0);
        });

        it('accepts 0 (allowNegative: false, min defaults to 0)', async () => {
            expect(await getFieldErrors('monthlyRent', 0)).toHaveLength(0);
        });

        it('is optional — undefined is accepted', async () => {
            expect(await getFieldErrors('monthlyRent', undefined)).toHaveLength(0);
        });

        it('rejects a negative number', async () => {
            expect(await getFieldErrors('monthlyRent', -1)).not.toHaveLength(0);
        });

        it('rejects a string', async () => {
            expect(await getFieldErrors('monthlyRent', 'two thousand')).not.toHaveLength(0);
        });

        it('rejects NaN', async () => {
            expect(await getFieldErrors('monthlyRent', NaN)).not.toHaveLength(0);
        });

        it('accepts a decimal with up to 2 decimal places', async () => {
            expect(await getFieldErrors('monthlyRent', 2300.5)).toHaveLength(0);
        });

        it('rejects more than 2 decimal places', async () => {
            expect(await getFieldErrors('monthlyRent', 2300.999)).not.toHaveLength(0);
        });
    });

    describe('streetAddress (inherited, optional)', () => {
        it('accepts a valid street address', async () => {
            expect(await getFieldErrors('streetAddress', 'Avenue Jean Paul II')).toHaveLength(0);
        });

        it('accepts undefined (optional via PartialType)', async () => {
            expect(await getFieldErrors('streetAddress', undefined)).toHaveLength(0);
        });

        it('rejects a value below minLength of 4 when provided', async () => {
            expect(await getFieldErrors('streetAddress', 'Ave')).not.toHaveLength(0);
        });

        it('rejects a non-string when provided', async () => {
            expect(await getFieldErrors('streetAddress', 123)).not.toHaveLength(0);
        });
    });

    describe('city (inherited, optional)', () => {
        it('accepts a valid city', async () => {
            expect(await getFieldErrors('city', 'Toronto')).toHaveLength(0);
        });

        it('accepts undefined', async () => {
            expect(await getFieldErrors('city', undefined)).toHaveLength(0);
        });

        it('rejects a value below minLength of 3', async () => {
            expect(await getFieldErrors('city', 'TO')).not.toHaveLength(0);
        });
    });

    describe('state (inherited, optional)', () => {
        it('accepts a valid state', async () => {
            expect(await getFieldErrors('state', 'Ontario')).toHaveLength(0);
        });

        it('accepts undefined', async () => {
            expect(await getFieldErrors('state', undefined)).toHaveLength(0);
        });

        it('rejects a value below minLength of 3', async () => {
            expect(await getFieldErrors('state', 'ON')).not.toHaveLength(0);
        });
    });

    describe('zipCode (inherited, optional)', () => {
        it('accepts a valid 5-digit ZIP', async () => {
            expect(await getFieldErrors('zipCode', '12345')).toHaveLength(0);
        });

        it('accepts a valid ZIP+4', async () => {
            expect(await getFieldErrors('zipCode', '12345-6789')).toHaveLength(0);
        });

        it('accepts undefined', async () => {
            expect(await getFieldErrors('zipCode', undefined)).toHaveLength(0);
        });

        it('rejects an invalid ZIP when provided', async () => {
            expect(await getFieldErrors('zipCode', 'ABCDE')).not.toHaveLength(0);
        });
    });

    describe('propertyType (inherited, optional)', () => {
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

        it('accepts undefined', async () => {
            expect(await getFieldErrors('propertyType', undefined)).toHaveLength(0);
        });

        it('rejects an invalid enum value', async () => {
            expect(await getFieldErrors('propertyType', 'CONDO')).not.toHaveLength(0);
        });
    });

    describe('principalInterest (inherited, optional)', () => {
        it('accepts a valid number', async () => {
            expect(await getFieldErrors('principalInterest', 500)).toHaveLength(0);
        });

        it('accepts 0', async () => {
            expect(await getFieldErrors('principalInterest', 0)).toHaveLength(0);
        });

        it('accepts undefined', async () => {
            expect(await getFieldErrors('principalInterest', undefined)).toHaveLength(0);
        });

        it('rejects a negative value', async () => {
            expect(await getFieldErrors('principalInterest', -1)).not.toHaveLength(0);
        });

        it('rejects more than 2 decimal places', async () => {
            expect(await getFieldErrors('principalInterest', 100.999)).not.toHaveLength(0);
        });
    });

    describe('taxesEscrow (inherited, optional)', () => {
        it('accepts a valid number', async () => {
            expect(await getFieldErrors('taxesEscrow', 200)).toHaveLength(0);
        });

        it('accepts undefined', async () => {
            expect(await getFieldErrors('taxesEscrow', undefined)).toHaveLength(0);
        });

        it('rejects a negative value', async () => {
            expect(await getFieldErrors('taxesEscrow', -50)).not.toHaveLength(0);
        });
    });

    describe('pMInsurance (inherited, optional)', () => {
        it('accepts a valid number', async () => {
            expect(await getFieldErrors('pMInsurance', 80)).toHaveLength(0);
        });

        it('accepts undefined', async () => {
            expect(await getFieldErrors('pMInsurance', undefined)).toHaveLength(0);
        });

        it('rejects a negative value', async () => {
            expect(await getFieldErrors('pMInsurance', -10)).not.toHaveLength(0);
        });
    });

    describe('hoaFees (inherited, optional)', () => {
        it('accepts a valid number', async () => {
            expect(await getFieldErrors('hoaFees', 100)).toHaveLength(0);
        });

        it('accepts undefined', async () => {
            expect(await getFieldErrors('hoaFees', undefined)).toHaveLength(0);
        });

        it('rejects a negative value', async () => {
            expect(await getFieldErrors('hoaFees', -5)).not.toHaveLength(0);
        });
    });

    describe('monthlyRentalIncome (inherited, optional)', () => {
        it('accepts a valid number', async () => {
            expect(await getFieldErrors('monthlyRentalIncome', 2000)).toHaveLength(0);
        });

        it('accepts undefined', async () => {
            expect(await getFieldErrors('monthlyRentalIncome', undefined)).toHaveLength(0);
        });

        it('rejects a negative value', async () => {
            expect(await getFieldErrors('monthlyRentalIncome', -200)).not.toHaveLength(0);
        });

        it('rejects a string', async () => {
            expect(await getFieldErrors('monthlyRentalIncome', 'fifteen hundred')).not.toHaveLength(
                0,
            );
        });
    });
});
