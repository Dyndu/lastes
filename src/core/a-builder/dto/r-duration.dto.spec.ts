import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { RDurationDto } from './r-duration.dto';

const makeValid = (overrides = {}): object => ({
    rehabDuration: 3,
    rContingency: 10,
    hasItems: false,
    ...overrides,
});

describe('RDurationDto', () => {
    const validate_ = (plain: object) => validate(plainToInstance(RDurationDto, plain));

    it('should pass with all required fields and no optional', async () => {
        expect(await validate_(makeValid())).toHaveLength(0);
    });

    it('should pass with holdingCoast provided', async () => {
        expect(await validate_(makeValid({ holdingCoast: 2400 }))).toHaveLength(0);
    });

    it('should pass with a valid item provided', async () => {
        expect(
            await validate_(
                makeValid({
                    item: {
                        originationFee: 100,
                        hazardInsurance: 200,
                        floodInsurance: 150,
                        propertyTaxes: 300,
                        annualAssessment: 100,
                        escrowFees: 50,
                        attorneyFees: 75,
                        inspectionFees: 80,
                        lenderFees: 90,
                        recordingFees: 60,
                        appraisal: 400,
                        transferTax: 200,
                        other: 50,
                    },
                }),
            ),
        ).toHaveLength(0);
    });

    describe('rehabDuration (required)', () => {
        it('should fail when missing', async () => {
            const errors = await validate_(makeValid({ rehabDuration: undefined }));
            expect(errors.some((e) => e.property === 'rehabDuration')).toBe(true);
        });

        it('should fail when a string', async () => {
            const errors = await validate_(makeValid({ rehabDuration: 'bad' }));
            expect(errors.some((e) => e.property === 'rehabDuration')).toBe(true);
        });

        it('should pass with 0', async () => {
            expect(await validate_(makeValid({ rehabDuration: 0 }))).toHaveLength(0);
        });
    });

    describe('rContingency (required, 0-100)', () => {
        it('should fail when missing', async () => {
            const errors = await validate_(makeValid({ rContingency: undefined }));
            expect(errors.some((e) => e.property === 'rContingency')).toBe(true);
        });

        it('should fail when exceeds 100', async () => {
            const errors = await validate_(makeValid({ rContingency: 101 }));
            expect(errors.some((e) => e.property === 'rContingency')).toBe(true);
        });

        it('should pass when exactly 100', async () => {
            expect(await validate_(makeValid({ rContingency: 100 }))).toHaveLength(0);
        });

        it('should pass when 0', async () => {
            expect(await validate_(makeValid({ rContingency: 0 }))).toHaveLength(0);
        });

        it('should fail when a string', async () => {
            const errors = await validate_(makeValid({ rContingency: 'bad' }));
            expect(errors.some((e) => e.property === 'rContingency')).toBe(true);
        });
    });

    describe('hasItems (required boolean)', () => {
        it('should fail when missing', async () => {
            const errors = await validate_(makeValid({ hasItems: undefined }));
            expect(errors.some((e) => e.property === 'hasItems')).toBe(true);
        });

        it('should fail when a string', async () => {
            const errors = await validate_(makeValid({ hasItems: 'yes' }));
            expect(errors.some((e) => e.property === 'hasItems')).toBe(true);
        });

        it('should pass with true', async () => {
            expect(await validate_(makeValid({ hasItems: true }))).toHaveLength(0);
        });

        it('should pass with false', async () => {
            expect(await validate_(makeValid({ hasItems: false }))).toHaveLength(0);
        });
    });

    describe('holdingCoast (optional)', () => {
        it('should pass when omitted', async () => {
            const errors = await validate_(makeValid({ holdingCoast: undefined }));
            expect(errors.some((e) => e.property === 'holdingCoast')).toBe(false);
        });

        it('should fail when negative', async () => {
            const errors = await validate_(makeValid({ holdingCoast: -1 }));
            expect(errors.some((e) => e.property === 'holdingCoast')).toBe(true);
        });

        it('should fail when a string', async () => {
            const errors = await validate_(makeValid({ holdingCoast: 'bad' }));
            expect(errors.some((e) => e.property === 'holdingCoast')).toBe(true);
        });

        it('should pass with 0', async () => {
            expect(await validate_(makeValid({ holdingCoast: 0 }))).toHaveLength(0);
        });
    });

    describe('item (optional nested AdItemizedDto)', () => {
        it('should pass when item is omitted', async () => {
            const errors = await validate_(makeValid({ item: undefined }));
            expect(errors.some((e) => e.property === 'item')).toBe(false);
        });

        it('should fail when item has a missing required field', async () => {
            const errors = await validate_(
                makeValid({
                    item: { hazardInsurance: 200, floodInsurance: 150 },
                }),
            );
            expect(errors.some((e) => e.property === 'item')).toBe(true);
        });

        it('should fail when item has a negative field', async () => {
            const errors = await validate_(
                makeValid({
                    item: {
                        originationFee: -1,
                        hazardInsurance: 200,
                        floodInsurance: 150,
                        annualAssessment: 100,
                        escrowFees: 50,
                        attorneyFees: 75,
                        inspectionFees: 80,
                        lenderFees: 90,
                        recordingFees: 60,
                        appraisal: 400,
                        transferTax: 200,
                        other: 50,
                    },
                }),
            );
            expect(errors.some((e) => e.property === 'item')).toBe(true);
        });

        it('should fail when item has a string field', async () => {
            const errors = await validate_(
                makeValid({
                    item: {
                        originationFee: 'bad',
                        hazardInsurance: 200,
                        floodInsurance: 150,
                        annualAssessment: 100,
                        escrowFees: 50,
                        attorneyFees: 75,
                        inspectionFees: 80,
                        lenderFees: 90,
                        recordingFees: 60,
                        appraisal: 400,
                        transferTax: 200,
                        other: 50,
                    },
                }),
            );
            expect(errors.some((e) => e.property === 'item')).toBe(true);
        });
    });

    describe('create-repairs.dto.spec.ts', () => {});
});
