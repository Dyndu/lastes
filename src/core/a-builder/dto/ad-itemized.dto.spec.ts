import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { AdItemizedDto } from './ad-itemized.dto';

const makeValid = (overrides = {}): object => ({
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
    ...overrides,
});

describe('AdItemizedDto', () => {
    const validate_ = (plain: object) => validate(plainToInstance(AdItemizedDto, plain));

    const requiredFields = [
        'originationFee',
        'hazardInsurance',
        'floodInsurance',
        'annualAssessment',
        'escrowFees',
        'attorneyFees',
        'inspectionFees',
        'lenderFees',
        'recordingFees',
        'appraisal',
        'transferTax',
        'other',
    ];

    it('should pass with all valid fields', async () => {
        expect(await validate_(makeValid())).toHaveLength(0);
    });

    it('should pass with 0 for all numeric fields', async () => {
        expect(
            await validate_(
                makeValid({
                    originationFee: 0,
                    hazardInsurance: 0,
                    floodInsurance: 0,
                    propertyTaxes: 0,
                    annualAssessment: 0,
                    escrowFees: 0,
                    attorneyFees: 0,
                    inspectionFees: 0,
                    lenderFees: 0,
                    recordingFees: 0,
                    appraisal: 0,
                    transferTax: 0,
                    other: 0,
                }),
            ),
        ).toHaveLength(0);
    });

    describe('propertyTaxes (optional)', () => {
        it('should pass when propertyTaxes is omitted', async () => {
            const errors = await validate_(makeValid({ propertyTaxes: undefined }));
            expect(errors.some((e) => e.property === 'propertyTaxes')).toBe(false);
        });

        it('should fail when propertyTaxes is negative', async () => {
            const errors = await validate_(makeValid({ propertyTaxes: -1 }));
            expect(errors.some((e) => e.property === 'propertyTaxes')).toBe(true);
        });

        it('should fail when propertyTaxes is a string', async () => {
            const errors = await validate_(makeValid({ propertyTaxes: 'bad' }));
            expect(errors.some((e) => e.property === 'propertyTaxes')).toBe(true);
        });
    });

    requiredFields.forEach((field) => {
        describe(`${field} (required)`, () => {
            it(`should fail when ${field} is missing`, async () => {
                const errors = await validate_(makeValid({ [field]: undefined }));
                expect(errors.some((e) => e.property === field)).toBe(true);
            });

            it(`should fail when ${field} is negative`, async () => {
                const errors = await validate_(makeValid({ [field]: -1 }));
                expect(errors.some((e) => e.property === field)).toBe(true);
            });

            it(`should fail when ${field} is a string`, async () => {
                const errors = await validate_(makeValid({ [field]: 'bad' }));
                expect(errors.some((e) => e.property === field)).toBe(true);
            });
        });
    });
});
