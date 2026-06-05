import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { BaseRentalAnalysisDto } from './base-rental-analysis.dto';

describe('BaseRentalAnalysisDto', () => {
    const validPayload = {
        ltv: 80,
        occupancyRate: 95,
        managementFeePercent: 10,
        maintenanceEscrowPercent: 5,
    };

    const build = (data: object) => plainToInstance(BaseRentalAnalysisDto, data);
    const check = (data: object) => validate(build(data));

    describe('valid cases', () => {
        it('should pass with all required fields', async () => {
            const errors = await check(validPayload);
            expect(errors).toHaveLength(0);
        });

        it('should pass with optional settingId as valid UUID v4', async () => {
            const errors = await check({
                ...validPayload,
                settingId: '3fb7cde0-35d2-43b7-8172-87ddae7fda60',
            });
            expect(errors).toHaveLength(0);
        });

        it('should pass without settingId (optional)', async () => {
            const errors = await check({ ...validPayload });
            expect(errors).toHaveLength(0);
        });

        it('should pass with boundary values 0 and 100', async () => {
            const errors = await check({
                ltv: 0,
                occupancyRate: 100,
                managementFeePercent: 0,
                maintenanceEscrowPercent: 100,
            });
            expect(errors).toHaveLength(0);
        });
    });

    describe('ltv', () => {
        it('should fail when missing', async () => {
            const { ltv, ...rest } = validPayload;
            const errors = await check(rest);
            expect(errors.some((e) => e.property === 'ltv')).toBe(true);
        });

        it('should fail when below 0', async () => {
            const errors = await check({ ...validPayload, ltv: -1 });
            expect(errors.some((e) => e.property === 'ltv')).toBe(true);
        });

        it('should fail when above 100', async () => {
            const errors = await check({ ...validPayload, ltv: 101 });
            expect(errors.some((e) => e.property === 'ltv')).toBe(true);
        });

        it('should fail when not a number', async () => {
            const errors = await check({ ...validPayload, ltv: 'abc' });
            expect(errors.some((e) => e.property === 'ltv')).toBe(true);
        });
    });

    describe('occupancyRate', () => {
        it('should fail when missing', async () => {
            const { occupancyRate, ...rest } = validPayload;
            const errors = await check(rest);
            expect(errors.some((e) => e.property === 'occupancyRate')).toBe(true);
        });

        it('should fail when below 0', async () => {
            const errors = await check({ ...validPayload, occupancyRate: -1 });
            expect(errors.some((e) => e.property === 'occupancyRate')).toBe(true);
        });

        it('should fail when above 100', async () => {
            const errors = await check({ ...validPayload, occupancyRate: 101 });
            expect(errors.some((e) => e.property === 'occupancyRate')).toBe(true);
        });

        it('should fail when not a number', async () => {
            const errors = await check({ ...validPayload, occupancyRate: 'abc' });
            expect(errors.some((e) => e.property === 'occupancyRate')).toBe(true);
        });
    });

    describe('managementFeePercent', () => {
        it('should fail when missing', async () => {
            const { managementFeePercent, ...rest } = validPayload;
            const errors = await check(rest);
            expect(errors.some((e) => e.property === 'managementFeePercent')).toBe(true);
        });

        it('should fail when below 0', async () => {
            const errors = await check({ ...validPayload, managementFeePercent: -1 });
            expect(errors.some((e) => e.property === 'managementFeePercent')).toBe(true);
        });

        it('should fail when above 100', async () => {
            const errors = await check({ ...validPayload, managementFeePercent: 101 });
            expect(errors.some((e) => e.property === 'managementFeePercent')).toBe(true);
        });

        it('should fail when not a number', async () => {
            const errors = await check({ ...validPayload, managementFeePercent: 'abc' });
            expect(errors.some((e) => e.property === 'managementFeePercent')).toBe(true);
        });
    });

    describe('maintenanceEscrowPercent', () => {
        it('should fail when missing', async () => {
            const { maintenanceEscrowPercent, ...rest } = validPayload;
            const errors = await check(rest);
            expect(errors.some((e) => e.property === 'maintenanceEscrowPercent')).toBe(true);
        });

        it('should fail when below 0', async () => {
            const errors = await check({ ...validPayload, maintenanceEscrowPercent: -1 });
            expect(errors.some((e) => e.property === 'maintenanceEscrowPercent')).toBe(true);
        });

        it('should fail when above 100', async () => {
            const errors = await check({ ...validPayload, maintenanceEscrowPercent: 101 });
            expect(errors.some((e) => e.property === 'maintenanceEscrowPercent')).toBe(true);
        });

        it('should fail when not a number', async () => {
            const errors = await check({ ...validPayload, maintenanceEscrowPercent: 'abc' });
            expect(errors.some((e) => e.property === 'maintenanceEscrowPercent')).toBe(true);
        });
    });

    describe('settingId', () => {
        it('should fail when not a valid UUID v4', async () => {
            const errors = await check({ ...validPayload, settingId: 'not-a-uuid' });
            expect(errors.some((e) => e.property === 'settingId')).toBe(true);
        });

        it('should fail when settingId is a UUID v1', async () => {
            const errors = await check({
                ...validPayload,
                settingId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
            });
            expect(errors.some((e) => e.property === 'settingId')).toBe(true);
        });
    });
});
