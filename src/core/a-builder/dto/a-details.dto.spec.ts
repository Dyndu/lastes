import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ADetailsDto } from './a-details.dto';
import { AcquisitionMethodEnum, AcquisitionLoanTypeEnum } from '../../../common/enum';

const validBase = {
    method: AcquisitionMethodEnum.CASH,
    purchasePrice: 100000,
    sellerConcessions: 5000,
    credits: 2000,
    hasItems: false,
};

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('ADetailsDto', () => {
    const validate_ = async (plain: object) => {
        const dto = plainToInstance(ADetailsDto, plain);
        return validate(dto);
    };

    describe('method', () => {
        it('should pass with a valid enum value', async () => {
            const errors = await validate_({
                ...validBase,
                method: AcquisitionMethodEnum.FINANCED,
            });
            expect(errors.find((e) => e.property === 'method')).toBeUndefined();
        });

        it('should fail when missing', async () => {
            const { method, ...rest } = validBase;
            const errors = await validate_(rest);
            expect(errors.find((e) => e.property === 'method')).toBeDefined();
        });

        it('should fail with an invalid enum value', async () => {
            const errors = await validate_({ ...validBase, method: 'INVALID' });
            expect(errors.find((e) => e.property === 'method')).toBeDefined();
        });
    });

    describe('purchasePrice', () => {
        it('should pass with a valid positive number', async () => {
            const errors = await validate_({ ...validBase, purchasePrice: 250000 });
            expect(errors.find((e) => e.property === 'purchasePrice')).toBeUndefined();
        });

        it('should fail when missing', async () => {
            const { purchasePrice, ...rest } = validBase;
            const errors = await validate_(rest);
            expect(errors.find((e) => e.property === 'purchasePrice')).toBeDefined();
        });

        it('should fail with a negative value', async () => {
            const errors = await validate_({ ...validBase, purchasePrice: -1 });
            expect(errors.find((e) => e.property === 'purchasePrice')).toBeDefined();
        });

        it('should fail with a string', async () => {
            const errors = await validate_({ ...validBase, purchasePrice: 'abc' });
            expect(errors.find((e) => e.property === 'purchasePrice')).toBeDefined();
        });
    });

    describe('sellerConcessions', () => {
        it('should pass with zero', async () => {
            const errors = await validate_({ ...validBase, sellerConcessions: 0 });
            expect(errors.find((e) => e.property === 'sellerConcessions')).toBeUndefined();
        });

        it('should fail when missing', async () => {
            const { sellerConcessions, ...rest } = validBase;
            const errors = await validate_(rest);
            expect(errors.find((e) => e.property === 'sellerConcessions')).toBeDefined();
        });

        it('should fail with a negative value', async () => {
            const errors = await validate_({ ...validBase, sellerConcessions: -500 });
            expect(errors.find((e) => e.property === 'sellerConcessions')).toBeDefined();
        });
    });

    describe('credits', () => {
        it('should pass with a valid value', async () => {
            const errors = await validate_({ ...validBase, credits: 1000 });
            expect(errors.find((e) => e.property === 'credits')).toBeUndefined();
        });

        it('should fail when missing', async () => {
            const { credits, ...rest } = validBase;
            const errors = await validate_(rest);
            expect(errors.find((e) => e.property === 'credits')).toBeDefined();
        });
    });

    describe('hasItems', () => {
        it('should pass with true', async () => {
            const errors = await validate_({ ...validBase, hasItems: true });
            expect(errors.find((e) => e.property === 'hasItems')).toBeUndefined();
        });

        it('should pass with false', async () => {
            const errors = await validate_({ ...validBase, hasItems: false });
            expect(errors.find((e) => e.property === 'hasItems')).toBeUndefined();
        });

        it('should fail with a non-boolean', async () => {
            const errors = await validate_({ ...validBase, hasItems: 'yes' });
            expect(errors.find((e) => e.property === 'hasItems')).toBeDefined();
        });

        it('should fail when missing', async () => {
            const { hasItems, ...rest } = validBase;
            const errors = await validate_(rest);
            expect(errors.find((e) => e.property === 'hasItems')).toBeDefined();
        });
    });

    describe('acquisitionCoast (optional)', () => {
        it('should pass when absent', async () => {
            const errors = await validate_(validBase);
            expect(errors.find((e) => e.property === 'acquisitionCoast')).toBeUndefined();
        });

        it('should pass with a valid value', async () => {
            const errors = await validate_({ ...validBase, acquisitionCoast: 3000 });
            expect(errors.find((e) => e.property === 'acquisitionCoast')).toBeUndefined();
        });

        it('should fail with a negative value', async () => {
            const errors = await validate_({ ...validBase, acquisitionCoast: -1 });
            expect(errors.find((e) => e.property === 'acquisitionCoast')).toBeDefined();
        });
    });

    describe('downPayment (optional)', () => {
        it('should pass when absent', async () => {
            const errors = await validate_(validBase);
            expect(errors.find((e) => e.property === 'downPayment')).toBeUndefined();
        });

        it('should pass with a valid value', async () => {
            const errors = await validate_({ ...validBase, downPayment: 20000 });
            expect(errors.find((e) => e.property === 'downPayment')).toBeUndefined();
        });

        it('should fail with a negative value', async () => {
            const errors = await validate_({ ...validBase, downPayment: -100 });
            expect(errors.find((e) => e.property === 'downPayment')).toBeDefined();
        });
    });

    describe('loanInterest (optional)', () => {
        it('should pass when absent', async () => {
            const errors = await validate_(validBase);
            expect(errors.find((e) => e.property === 'loanInterest')).toBeUndefined();
        });

        it('should pass with a value between 0 and 100', async () => {
            const errors = await validate_({ ...validBase, loanInterest: 5.5 });
            expect(errors.find((e) => e.property === 'loanInterest')).toBeUndefined();
        });

        it('should fail above 100', async () => {
            const errors = await validate_({ ...validBase, loanInterest: 101 });
            expect(errors.find((e) => e.property === 'loanInterest')).toBeDefined();
        });

        it('should fail with a negative value', async () => {
            const errors = await validate_({ ...validBase, loanInterest: -1 });
            expect(errors.find((e) => e.property === 'loanInterest')).toBeDefined();
        });
    });

    describe('points (optional)', () => {
        it('should pass with a value between 0 and 100', async () => {
            const errors = await validate_({ ...validBase, points: 2 });
            expect(errors.find((e) => e.property === 'points')).toBeUndefined();
        });

        it('should fail above 100', async () => {
            const errors = await validate_({ ...validBase, points: 150 });
            expect(errors.find((e) => e.property === 'points')).toBeDefined();
        });
    });

    describe('loanLength (optional)', () => {
        it('should pass with a valid value', async () => {
            const errors = await validate_({ ...validBase, loanLength: 30 });
            expect(errors.find((e) => e.property === 'loanLength')).toBeUndefined();
        });

        it('should fail with a negative value', async () => {
            const errors = await validate_({ ...validBase, loanLength: -5 });
            expect(errors.find((e) => e.property === 'loanLength')).toBeDefined();
        });
    });

    describe('loanType (optional)', () => {
        it('should pass when absent', async () => {
            const errors = await validate_(validBase);
            expect(errors.find((e) => e.property === 'loanType')).toBeUndefined();
        });

        it('should pass with a valid enum value', async () => {
            const errors = await validate_({ ...validBase, loanType: AcquisitionLoanTypeEnum.FHA });
            expect(errors.find((e) => e.property === 'loanType')).toBeUndefined();
        });

        it('should fail with an invalid enum value', async () => {
            const errors = await validate_({ ...validBase, loanType: 'UNKNOWN' });
            expect(errors.find((e) => e.property === 'loanType')).toBeDefined();
        });
    });

    describe('item (optional nested AdItemizedDto)', () => {
        const validItem = {
            originationFee: 100,
            hazardInsurance: 200,
            floodInsurance: 150,
            propertyTaxes: 300,
            annualAssessment: 50,
            escrowFees: 75,
            attorneyFees: 500,
            inspectionFees: 400,
            lenderFees: 250,
            recordingFees: 80,
            appraisal: 600,
            transferTax: 120,
            other: 90,
        };

        it('should pass when item is absent', async () => {
            const errors = await validate_(validBase);
            expect(errors.find((e) => e.property === 'item')).toBeUndefined();
        });

        it('should pass with a valid nested item', async () => {
            const errors = await validate_({ ...validBase, item: validItem });
            expect(errors.find((e) => e.property === 'item')).toBeUndefined();
        });

        it('should fail when nested item has invalid fields', async () => {
            const errors = await validate_({
                ...validBase,
                item: { ...validItem, originationFee: -1 },
            });
            const itemError = errors.find((e) => e.property === 'item');
            expect(itemError?.children?.length).toBeGreaterThan(0);
        });
    });

    it('should pass with a fully valid object', async () => {
        const errors = await validate_({
            ...validBase,
            method: AcquisitionMethodEnum.FINANCED,
            acquisitionCoast: 5000,
            downPayment: 20000,
            loanInterest: 4.5,
            points: 1,
            loanLength: 30,
            loanType: AcquisitionLoanTypeEnum.CONVENTIONAL,
        });
        expect(errors).toHaveLength(0);
    });
});
