import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { BuyHoldDto } from './buy-hold.dto';

describe('BuyHoldDto', () => {
    const validPayload = {
        ltv: 80,
        occupancyRate: 95,
        managementFeePercent: 10,
        maintenanceEscrowPercent: 5,
        depreciationPercent: 20,
    };

    const build = (data: object) => plainToInstance(BuyHoldDto, data);
    const check = (data: object) => validate(build(data));

    describe('valid cases', () => {
        it('should pass with only required inherited fields', async () => {
            const errors = await check(validPayload);
            expect(errors).toHaveLength(0);
        });

        it('should pass with all optional fields provided', async () => {
            const errors = await check({
                ...validPayload,
                annualAppreciationRate: 3,
                incomeIncreasePerYear: 2,
                expenseIncreasePerYear: 1,
                sellingCosts: 6,
                vacancy: 5,
            });
            expect(errors).toHaveLength(0);
        });

        it('should pass with all optional fields at boundary 0', async () => {
            const errors = await check({
                ...validPayload,
                annualAppreciationRate: 0,
                incomeIncreasePerYear: 0,
                expenseIncreasePerYear: 0,
                sellingCosts: 0,
                vacancy: 0,
            });
            expect(errors).toHaveLength(0);
        });

        it('should pass with all optional fields at boundary 100', async () => {
            const errors = await check({
                ...validPayload,
                annualAppreciationRate: 100,
                incomeIncreasePerYear: 100,
                expenseIncreasePerYear: 100,
                sellingCosts: 100,
                vacancy: 100,
            });
            expect(errors).toHaveLength(0);
        });
    });

    describe('annualAppreciationRate', () => {
        it('should pass when missing (optional)', async () => {
            const errors = await check(validPayload);
            expect(errors.some((e) => e.property === 'annualAppreciationRate')).toBe(false);
        });

        it('should fail when below 0', async () => {
            const errors = await check({ ...validPayload, annualAppreciationRate: -1 });
            expect(errors.some((e) => e.property === 'annualAppreciationRate')).toBe(true);
        });

        it('should fail when above 100', async () => {
            const errors = await check({ ...validPayload, annualAppreciationRate: 101 });
            expect(errors.some((e) => e.property === 'annualAppreciationRate')).toBe(true);
        });

        it('should fail when not a number', async () => {
            const errors = await check({ ...validPayload, annualAppreciationRate: 'abc' });
            expect(errors.some((e) => e.property === 'annualAppreciationRate')).toBe(true);
        });
    });

    describe('incomeIncreasePerYear', () => {
        it('should pass when missing (optional)', async () => {
            const errors = await check(validPayload);
            expect(errors.some((e) => e.property === 'incomeIncreasePerYear')).toBe(false);
        });

        it('should fail when below 0', async () => {
            const errors = await check({ ...validPayload, incomeIncreasePerYear: -1 });
            expect(errors.some((e) => e.property === 'incomeIncreasePerYear')).toBe(true);
        });

        it('should fail when above 100', async () => {
            const errors = await check({ ...validPayload, incomeIncreasePerYear: 101 });
            expect(errors.some((e) => e.property === 'incomeIncreasePerYear')).toBe(true);
        });

        it('should fail when not a number', async () => {
            const errors = await check({ ...validPayload, incomeIncreasePerYear: 'abc' });
            expect(errors.some((e) => e.property === 'incomeIncreasePerYear')).toBe(true);
        });
    });

    describe('expenseIncreasePerYear', () => {
        it('should pass when missing (optional)', async () => {
            const errors = await check(validPayload);
            expect(errors.some((e) => e.property === 'expenseIncreasePerYear')).toBe(false);
        });

        it('should fail when below 0', async () => {
            const errors = await check({ ...validPayload, expenseIncreasePerYear: -1 });
            expect(errors.some((e) => e.property === 'expenseIncreasePerYear')).toBe(true);
        });

        it('should fail when above 100', async () => {
            const errors = await check({ ...validPayload, expenseIncreasePerYear: 101 });
            expect(errors.some((e) => e.property === 'expenseIncreasePerYear')).toBe(true);
        });

        it('should fail when not a number', async () => {
            const errors = await check({ ...validPayload, expenseIncreasePerYear: 'abc' });
            expect(errors.some((e) => e.property === 'expenseIncreasePerYear')).toBe(true);
        });
    });

    describe('sellingCosts', () => {
        it('should pass when missing (optional)', async () => {
            const errors = await check(validPayload);
            expect(errors.some((e) => e.property === 'sellingCosts')).toBe(false);
        });

        it('should fail when below 0', async () => {
            const errors = await check({ ...validPayload, sellingCosts: -1 });
            expect(errors.some((e) => e.property === 'sellingCosts')).toBe(true);
        });

        it('should fail when above 100', async () => {
            const errors = await check({ ...validPayload, sellingCosts: 101 });
            expect(errors.some((e) => e.property === 'sellingCosts')).toBe(true);
        });

        it('should fail when not a number', async () => {
            const errors = await check({ ...validPayload, sellingCosts: 'abc' });
            expect(errors.some((e) => e.property === 'sellingCosts')).toBe(true);
        });
    });

    describe('vacancy', () => {
        it('should pass when missing (optional)', async () => {
            const errors = await check(validPayload);
            expect(errors.some((e) => e.property === 'vacancy')).toBe(false);
        });

        it('should fail when below 0', async () => {
            const errors = await check({ ...validPayload, vacancy: -1 });
            expect(errors.some((e) => e.property === 'vacancy')).toBe(true);
        });

        it('should fail when above 100', async () => {
            const errors = await check({ ...validPayload, vacancy: 101 });
            expect(errors.some((e) => e.property === 'vacancy')).toBe(true);
        });

        it('should fail when not a number', async () => {
            const errors = await check({ ...validPayload, vacancy: 'abc' });
            expect(errors.some((e) => e.property === 'vacancy')).toBe(true);
        });
    });
});
