import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateSaleDto } from './create-sale.dto';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

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

const validBase = {
    afterRepairValue: 300000,
    targetProfit: 50000,
};

describe('CreateSaleDto', () => {
    const validate_ = async (plain: object) => {
        const dto = plainToInstance(CreateSaleDto, plain);
        return validate(dto);
    };

    it('should pass with a minimal valid object', async () => {
        const errors = await validate_(validBase);
        expect(errors).toHaveLength(0);
    });

    describe('afterRepairValue', () => {
        it('should fail when missing', async () => {
            const { afterRepairValue: _, ...rest } = validBase;
            const errors = await validate_(rest);
            expect(errors.find((e) => e.property === 'afterRepairValue')).toBeDefined();
        });

        it('should pass with zero', async () => {
            const errors = await validate_({ ...validBase, afterRepairValue: 0 });
            expect(errors.find((e) => e.property === 'afterRepairValue')).toBeUndefined();
        });

        it('should fail with a negative value', async () => {
            const errors = await validate_({ ...validBase, afterRepairValue: -1 });
            expect(errors.find((e) => e.property === 'afterRepairValue')).toBeDefined();
        });

        it('should fail with a non-numeric value', async () => {
            const errors = await validate_({ ...validBase, afterRepairValue: 'abc' });
            expect(errors.find((e) => e.property === 'afterRepairValue')).toBeDefined();
        });
    });

    describe('targetProfit', () => {
        it('should fail when missing', async () => {
            const { targetProfit: _, ...rest } = validBase;
            const errors = await validate_(rest);
            expect(errors.find((e) => e.property === 'targetProfit')).toBeDefined();
        });

        it('should pass with zero', async () => {
            const errors = await validate_({ ...validBase, targetProfit: 0 });
            expect(errors.find((e) => e.property === 'targetProfit')).toBeUndefined();
        });

        it('should fail with a negative value', async () => {
            const errors = await validate_({ ...validBase, targetProfit: -1 });
            expect(errors.find((e) => e.property === 'targetProfit')).toBeDefined();
        });

        it('should fail with a non-numeric value', async () => {
            const errors = await validate_({ ...validBase, targetProfit: 'abc' });
            expect(errors.find((e) => e.property === 'targetProfit')).toBeDefined();
        });
    });

    describe('saleClosingCoast', () => {
        it('should pass when absent', async () => {
            const errors = await validate_(validBase);
            expect(errors.find((e) => e.property === 'saleClosingCoast')).toBeUndefined();
        });

        it('should pass with a valid value', async () => {
            const errors = await validate_({ ...validBase, saleClosingCoast: 3000 });
            expect(errors.find((e) => e.property === 'saleClosingCoast')).toBeUndefined();
        });

        it('should pass with zero', async () => {
            const errors = await validate_({ ...validBase, saleClosingCoast: 0 });
            expect(errors.find((e) => e.property === 'saleClosingCoast')).toBeUndefined();
        });

        it('should fail with a negative value', async () => {
            const errors = await validate_({ ...validBase, saleClosingCoast: -1 });
            expect(errors.find((e) => e.property === 'saleClosingCoast')).toBeDefined();
        });

        it('should fail with a non-numeric value', async () => {
            const errors = await validate_({ ...validBase, saleClosingCoast: 'abc' });
            expect(errors.find((e) => e.property === 'saleClosingCoast')).toBeDefined();
        });

        it('should fail with more than 2 decimal places', async () => {
            const errors = await validate_({ ...validBase, saleClosingCoast: 1.111 });
            expect(errors.find((e) => e.property === 'saleClosingCoast')).toBeDefined();
        });
    });

    describe('agentCommission', () => {
        it('should pass when absent', async () => {
            const errors = await validate_(validBase);
            expect(errors.find((e) => e.property === 'agentCommission')).toBeUndefined();
        });

        it('should pass with the minimum valid value', async () => {
            const errors = await validate_({ ...validBase, agentCommission: 2 });
            expect(errors.find((e) => e.property === 'agentCommission')).toBeUndefined();
        });

        it('should pass with the maximum valid value', async () => {
            const errors = await validate_({ ...validBase, agentCommission: 6 });
            expect(errors.find((e) => e.property === 'agentCommission')).toBeUndefined();
        });

        it('should fail below the minimum value', async () => {
            const errors = await validate_({ ...validBase, agentCommission: -1.99 });
            expect(errors.find((e) => e.property === 'agentCommission')).toBeDefined();
        });

        it('should fail above the maximum value', async () => {
            const errors = await validate_({ ...validBase, agentCommission: 6.01 });
            expect(errors.find((e) => e.property === 'agentCommission')).toBeDefined();
        });

        it('should fail with a negative value', async () => {
            const errors = await validate_({ ...validBase, agentCommission: -1 });
            expect(errors.find((e) => e.property === 'agentCommission')).toBeDefined();
        });

        it('should fail with a non-numeric value', async () => {
            const errors = await validate_({ ...validBase, agentCommission: 'abc' });
            expect(errors.find((e) => e.property === 'agentCommission')).toBeDefined();
        });

        it('should fail with more than 2 decimal places', async () => {
            const errors = await validate_({ ...validBase, agentCommission: 2.111 });
            expect(errors.find((e) => e.property === 'agentCommission')).toBeDefined();
        });
    });

    describe('item', () => {
        it('should pass when absent', async () => {
            const errors = await validate_(validBase);
            expect(errors.find((e) => e.property === 'item')).toBeUndefined();
        });

        it('should pass with a valid nested item', async () => {
            const errors = await validate_({ ...validBase, item: validItem });
            expect(errors.find((e) => e.property === 'item')).toBeUndefined();
        });

        it('should fail when nested item has a negative value', async () => {
            const errors = await validate_({
                ...validBase,
                item: { ...validItem, originationFee: -1 },
            });
            const itemError = errors.find((e) => e.property === 'item');
            expect(itemError?.children?.length).toBeGreaterThan(0);
        });

        it('should fail when nested item is missing a required field', async () => {
            const { originationFee: _, ...itemWithoutOriginationFee } = validItem;
            const errors = await validate_({ ...validBase, item: itemWithoutOriginationFee });
            const itemError = errors.find((e) => e.property === 'item');
            expect(itemError?.children?.length).toBeGreaterThan(0);
        });
    });

    it('should pass with a fully valid object', async () => {
        const errors = await validate_({
            ...validBase,
            saleClosingCoast: 5000,
            agentCommission: 3.5,
            item: validItem,
        });
        expect(errors).toHaveLength(0);
    });
});
