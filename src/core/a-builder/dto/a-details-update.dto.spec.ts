import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ADetailsUpdateDto } from './a-details-update.dto';
import { AcquisitionMethodEnum, AcquisitionLoanTypeEnum } from '../../../common/enum';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('ADetailsUpdateDto', () => {
    const validate_ = async (plain: object) => {
        const dto = plainToInstance(ADetailsUpdateDto, plain);
        return validate(dto);
    };

    it('should pass with an empty object (all fields optional)', async () => {
        const errors = await validate_({});
        expect(errors).toHaveLength(0);
    });

    describe('method', () => {
        it('should pass when absent', async () => {
            const errors = await validate_({});
            expect(errors.find((e) => e.property === 'method')).toBeUndefined();
        });

        it('should pass with a valid enum value', async () => {
            const errors = await validate_({ method: AcquisitionMethodEnum.CASH });
            expect(errors.find((e) => e.property === 'method')).toBeUndefined();
        });

        it('should fail with an invalid enum value', async () => {
            const errors = await validate_({ method: 'INVALID' });
            expect(errors.find((e) => e.property === 'method')).toBeDefined();
        });
    });

    describe('purchasePrice', () => {
        it('should pass when absent', async () => {
            const errors = await validate_({});
            expect(errors.find((e) => e.property === 'purchasePrice')).toBeUndefined();
        });

        it('should pass with a valid value', async () => {
            const errors = await validate_({ purchasePrice: 100000 });
            expect(errors.find((e) => e.property === 'purchasePrice')).toBeUndefined();
        });

        it('should fail with a negative value', async () => {
            const errors = await validate_({ purchasePrice: -1 });
            expect(errors.find((e) => e.property === 'purchasePrice')).toBeDefined();
        });

        it('should fail with a non-numeric value', async () => {
            const errors = await validate_({ purchasePrice: 'abc' });
            expect(errors.find((e) => e.property === 'purchasePrice')).toBeDefined();
        });
    });

    describe('sellerConcessions', () => {
        it('should pass when absent', async () => {
            const errors = await validate_({});
            expect(errors.find((e) => e.property === 'sellerConcessions')).toBeUndefined();
        });

        it('should pass with zero', async () => {
            const errors = await validate_({ sellerConcessions: 0 });
            expect(errors.find((e) => e.property === 'sellerConcessions')).toBeUndefined();
        });

        it('should fail with a negative value', async () => {
            const errors = await validate_({ sellerConcessions: -500 });
            expect(errors.find((e) => e.property === 'sellerConcessions')).toBeDefined();
        });
    });

    describe('credits', () => {
        it('should pass when absent', async () => {
            const errors = await validate_({});
            expect(errors.find((e) => e.property === 'credits')).toBeUndefined();
        });

        it('should pass with a valid value', async () => {
            const errors = await validate_({ credits: 2000 });
            expect(errors.find((e) => e.property === 'credits')).toBeUndefined();
        });

        it('should fail with a negative value', async () => {
            const errors = await validate_({ credits: -1 });
            expect(errors.find((e) => e.property === 'credits')).toBeDefined();
        });
    });

    describe('hasItems', () => {
        it('should pass when absent', async () => {
            const errors = await validate_({});
            expect(errors.find((e) => e.property === 'hasItems')).toBeUndefined();
        });

        it('should pass with true', async () => {
            const errors = await validate_({ hasItems: true });
            expect(errors.find((e) => e.property === 'hasItems')).toBeUndefined();
        });

        it('should pass with false', async () => {
            const errors = await validate_({ hasItems: false });
            expect(errors.find((e) => e.property === 'hasItems')).toBeUndefined();
        });

        it('should fail with a non-boolean', async () => {
            const errors = await validate_({ hasItems: 'yes' });
            expect(errors.find((e) => e.property === 'hasItems')).toBeDefined();
        });
    });

    describe('acquisitionCoast', () => {
        it('should pass when absent', async () => {
            const errors = await validate_({});
            expect(errors.find((e) => e.property === 'acquisitionCoast')).toBeUndefined();
        });

        it('should pass with a valid value', async () => {
            const errors = await validate_({ acquisitionCoast: 3000 });
            expect(errors.find((e) => e.property === 'acquisitionCoast')).toBeUndefined();
        });

        it('should fail with a negative value', async () => {
            const errors = await validate_({ acquisitionCoast: -1 });
            expect(errors.find((e) => e.property === 'acquisitionCoast')).toBeDefined();
        });
    });

    describe('downPayment', () => {
        it('should pass when absent', async () => {
            const errors = await validate_({});
            expect(errors.find((e) => e.property === 'downPayment')).toBeUndefined();
        });

        it('should pass with a valid value', async () => {
            const errors = await validate_({ downPayment: 20000 });
            expect(errors.find((e) => e.property === 'downPayment')).toBeUndefined();
        });

        it('should fail with a negative value', async () => {
            const errors = await validate_({ downPayment: -100 });
            expect(errors.find((e) => e.property === 'downPayment')).toBeDefined();
        });
    });

    describe('loanInterest', () => {
        it('should pass when absent', async () => {
            const errors = await validate_({});
            expect(errors.find((e) => e.property === 'loanInterest')).toBeUndefined();
        });

        it('should pass with a value between 0 and 100', async () => {
            const errors = await validate_({ loanInterest: 5.5 });
            expect(errors.find((e) => e.property === 'loanInterest')).toBeUndefined();
        });

        it('should fail above 100', async () => {
            const errors = await validate_({ loanInterest: 101 });
            expect(errors.find((e) => e.property === 'loanInterest')).toBeDefined();
        });

        it('should fail with a negative value', async () => {
            const errors = await validate_({ loanInterest: -1 });
            expect(errors.find((e) => e.property === 'loanInterest')).toBeDefined();
        });
    });

    describe('points', () => {
        it('should pass when absent', async () => {
            const errors = await validate_({});
            expect(errors.find((e) => e.property === 'points')).toBeUndefined();
        });

        it('should pass with a value between 0 and 100', async () => {
            const errors = await validate_({ points: 2 });
            expect(errors.find((e) => e.property === 'points')).toBeUndefined();
        });

        it('should fail above 100', async () => {
            const errors = await validate_({ points: 150 });
            expect(errors.find((e) => e.property === 'points')).toBeDefined();
        });

        it('should fail with a negative value', async () => {
            const errors = await validate_({ points: -1 });
            expect(errors.find((e) => e.property === 'points')).toBeDefined();
        });
    });

    describe('loanLength', () => {
        it('should pass when absent', async () => {
            const errors = await validate_({});
            expect(errors.find((e) => e.property === 'loanLength')).toBeUndefined();
        });

        it('should pass with a valid value', async () => {
            const errors = await validate_({ loanLength: 30 });
            expect(errors.find((e) => e.property === 'loanLength')).toBeUndefined();
        });

        it('should fail with a negative value', async () => {
            const errors = await validate_({ loanLength: -5 });
            expect(errors.find((e) => e.property === 'loanLength')).toBeDefined();
        });
    });

    describe('loanType', () => {
        it('should pass when absent', async () => {
            const errors = await validate_({});
            expect(errors.find((e) => e.property === 'loanType')).toBeUndefined();
        });

        it('should pass with a valid enum value', async () => {
            const errors = await validate_({ loanType: AcquisitionLoanTypeEnum.CONVENTIONAL });
            expect(errors.find((e) => e.property === 'loanType')).toBeUndefined();
        });

        it('should fail with an invalid enum value', async () => {
            const errors = await validate_({ loanType: 'UNKNOWN' });
            expect(errors.find((e) => e.property === 'loanType')).toBeDefined();
        });
    });

    describe('item', () => {
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

        it('should pass when absent', async () => {
            const errors = await validate_({});
            expect(errors.find((e) => e.property === 'item')).toBeUndefined();
        });

        it('should pass with a valid nested item', async () => {
            const errors = await validate_({ item: validItem });
            expect(errors.find((e) => e.property === 'item')).toBeUndefined();
        });

        it('should fail when nested item has invalid fields', async () => {
            const errors = await validate_({ item: { ...validItem, originationFee: -1 } });
            const itemError = errors.find((e) => e.property === 'item');
            expect(itemError?.children?.length).toBeGreaterThan(0);
        });
    });

    it('should pass with a full valid update payload', async () => {
        const errors = await validate_({
            method: AcquisitionMethodEnum.FINANCED,
            purchasePrice: 300000,
            sellerConcessions: 5000,
            credits: 2000,
            hasItems: true,
            acquisitionCoast: 5000,
            downPayment: 60000,
            loanInterest: 4.5,
            points: 1,
            loanLength: 30,
            loanType: AcquisitionLoanTypeEnum.CONVENTIONAL,
        });
        expect(errors).toHaveLength(0);
    });
});
