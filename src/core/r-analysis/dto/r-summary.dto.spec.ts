import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RentalSummaryDto } from './r-summary.dto';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const validBase = {
    ltv: 80,
    occupancyRate: 95,
    managementFeePercent: 10,
    maintenanceEscrowPercent: 5,
    depreciationPercent: 27,
};

function make(data: unknown) {
    return plainToInstance(RentalSummaryDto, data);
}

async function getErrors(data: unknown) {
    return validate(make(data));
}

function errorsOn(errors: Awaited<ReturnType<typeof getErrors>>, property: string) {
    return errors.find(e => e.property === property);
}

describe('RentalSummaryDto', () => {

    it('should pass with only required fields', async () => {
        expect(await getErrors(validBase)).toHaveLength(0);
    });

    it('should pass with all optional fields provided', async () => {
        const errors = await getErrors({
            ...validBase,
            incomeTaxRateOverride: 25,
            settingId: '3fb7cde0-35d2-43b7-8172-87ddae7fda60',
            appreciation: { yearsToExit: 10, annualAppreciationRate: 3, additionalEquity: 5000 },
            additionalPurchaseCosts: [{ label: 'Fee', amount: 100 }],
            additionalFixedExpenses: [{ label: 'Insurance', amount: 200 }],
            additionalIncome: [{ label: 'Parking', amount: 50 }],
        });
        expect(errors).toHaveLength(0);
    });

    describe('depreciationPercent', () => {
        it('should fail when missing', async () => {
            const { depreciationPercent: _, ...rest } = validBase;
            const errors = await getErrors(rest);
            expect(errorsOn(errors, 'depreciationPercent')).toBeDefined();
        });

        it('should fail when below min (0)', async () => {
            const errors = await getErrors({ ...validBase, depreciationPercent: -1 });
            expect(errorsOn(errors, 'depreciationPercent')).toBeDefined();
        });

        it('should fail when above max (100)', async () => {
            const errors = await getErrors({ ...validBase, depreciationPercent: 101 });
            expect(errorsOn(errors, 'depreciationPercent')).toBeDefined();
        });

        it('should pass at boundary values 0 and 100', async () => {
            expect(await getErrors({ ...validBase, depreciationPercent: 0 })).toHaveLength(0);
            expect(await getErrors({ ...validBase, depreciationPercent: 100 })).toHaveLength(0);
        });
    });

    describe('incomeTaxRateOverride', () => {
        it('should pass when omitted', async () => {
            expect(await getErrors(validBase)).toHaveLength(0);
        });

        it('should fail when below min (0)', async () => {
            const errors = await getErrors({ ...validBase, incomeTaxRateOverride: -1 });
            expect(errorsOn(errors, 'incomeTaxRateOverride')).toBeDefined();
        });

        it('should fail when above max (100)', async () => {
            const errors = await getErrors({ ...validBase, incomeTaxRateOverride: 101 });
            expect(errorsOn(errors, 'incomeTaxRateOverride')).toBeDefined();
        });

        it('should pass at boundary values 0 and 100', async () => {
            expect(await getErrors({ ...validBase, incomeTaxRateOverride: 0 })).toHaveLength(0);
            expect(await getErrors({ ...validBase, incomeTaxRateOverride: 100 })).toHaveLength(0);
        });
    });

    describe('appreciation', () => {
        it('should pass when omitted', async () => {
            expect(await getErrors(validBase)).toHaveLength(0);
        });

        it('should pass with an empty object (all fields have defaults)', async () => {
            expect(await getErrors({ ...validBase, appreciation: {} })).toHaveLength(0);
        });

        it('should fail when yearsToExit is below min (1)', async () => {
            const errors = await getErrors({ ...validBase, appreciation: { yearsToExit: 0 } });
            const nested = errorsOn(errors, 'appreciation');
            expect(nested?.children?.length).toBeGreaterThan(0);
        });

        it('should fail when annualAppreciationRate is negative', async () => {
            const errors = await getErrors({
                ...validBase,
                appreciation: { annualAppreciationRate: -1 },
            });
            const nested = errorsOn(errors, 'appreciation');
            expect(nested?.children?.length).toBeGreaterThan(0);
        });

        it('should fail when additionalEquity is negative', async () => {
            const errors = await getErrors({
                ...validBase,
                appreciation: { additionalEquity: -1 },
            });
            const nested = errorsOn(errors, 'appreciation');
            expect(nested?.children?.length).toBeGreaterThan(0);
        });
    });

    describe('ltv (inherited)', () => {
        it('should fail when missing', async () => {
            const { ltv: _, ...rest } = validBase;
            expect(errorsOn(await getErrors(rest), 'ltv')).toBeDefined();
        });

        it('should fail above max (100)', async () => {
            expect(errorsOn(await getErrors({ ...validBase, ltv: 101 }), 'ltv')).toBeDefined();
        });

        it('should pass at boundaries 0 and 100', async () => {
            expect(await getErrors({ ...validBase, ltv: 0 })).toHaveLength(0);
            expect(await getErrors({ ...validBase, ltv: 100 })).toHaveLength(0);
        });
    });

    describe('occupancyRate (inherited)', () => {
        it('should fail when missing', async () => {
            const { occupancyRate: _, ...rest } = validBase;
            expect(errorsOn(await getErrors(rest), 'occupancyRate')).toBeDefined();
        });

        it('should fail above max (100)', async () => {
            expect(errorsOn(await getErrors({ ...validBase, occupancyRate: 101 }), 'occupancyRate')).toBeDefined();
        });
    });

    describe('managementFeePercent (inherited)', () => {
        it('should fail when missing', async () => {
            const { managementFeePercent: _, ...rest } = validBase;
            expect(errorsOn(await getErrors(rest), 'managementFeePercent')).toBeDefined();
        });

        it('should fail above max (100)', async () => {
            expect(errorsOn(await getErrors({ ...validBase, managementFeePercent: 101 }), 'managementFeePercent')).toBeDefined();
        });
    });

    describe('maintenanceEscrowPercent (inherited)', () => {
        it('should fail when missing', async () => {
            const { maintenanceEscrowPercent: _, ...rest } = validBase;
            expect(errorsOn(await getErrors(rest), 'maintenanceEscrowPercent')).toBeDefined();
        });

        it('should fail above max (100)', async () => {
            expect(errorsOn(await getErrors({ ...validBase, maintenanceEscrowPercent: 101 }), 'maintenanceEscrowPercent')).toBeDefined();
        });
    });

    describe('settingId (inherited, optional)', () => {
        it('should pass when omitted', async () => {
            expect(await getErrors(validBase)).toHaveLength(0);
        });

        it('should fail when not a valid UUID v4', async () => {
            expect(errorsOn(await getErrors({ ...validBase, settingId: 'not-a-uuid' }), 'settingId')).toBeDefined();
        });

        it('should pass with a valid UUID v4', async () => {
            expect(await getErrors({ ...validBase, settingId: '3fb7cde0-35d2-43b7-8172-87ddae7fda60' })).toHaveLength(0);
        });
    });

    describe('additionalPurchaseCosts (inherited, optional)', () => {
        it('should pass when omitted', async () => {
            expect(await getErrors(validBase)).toHaveLength(0);
        });

        it('should pass with a valid item', async () => {
            expect(await getErrors({
                ...validBase,
                additionalPurchaseCosts: [{ label: 'Fee', amount: 100 }],
            })).toHaveLength(0);
        });

        it('should fail when an item has an invalid amount', async () => {
            const errors = await getErrors({
                ...validBase,
                additionalPurchaseCosts: [{ label: 'Fee', amount: -1 }],
            });
            expect(errorsOn(errors, 'additionalPurchaseCosts')).toBeDefined();
        });

        it('should fail when an item is missing its label', async () => {
            const errors = await getErrors({
                ...validBase,
                additionalPurchaseCosts: [{ amount: 100 }],
            });
            expect(errorsOn(errors, 'additionalPurchaseCosts')).toBeDefined();
        });
    });

    describe('additionalFixedExpenses (inherited, optional)', () => {
        it('should pass with a valid item', async () => {
            expect(await getErrors({
                ...validBase,
                additionalFixedExpenses: [{ label: 'Insurance', amount: 50 }],
            })).toHaveLength(0);
        });

        it('should fail when an item has an invalid field', async () => {
            const errors = await getErrors({
                ...validBase,
                additionalFixedExpenses: [{ label: '', amount: 50 }],
            });
            expect(errorsOn(errors, 'additionalFixedExpenses')).toBeDefined();
        });
    });

    describe('additionalIncome (inherited, optional)', () => {
        it('should pass with a valid item', async () => {
            expect(await getErrors({
                ...validBase,
                additionalIncome: [{ label: 'Parking', amount: 75 }],
            })).toHaveLength(0);
        });

        it('should fail when an item has an invalid field', async () => {
            const errors = await getErrors({
                ...validBase,
                additionalIncome: [{ label: 'Parking', amount: -10 }],
            });
            expect(errorsOn(errors, 'additionalIncome')).toBeDefined();
        });
    });
});
