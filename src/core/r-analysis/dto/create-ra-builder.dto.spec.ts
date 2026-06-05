import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateRaBuilderDto } from './create-ra-builder.dto';
import { PropertyDetailsTypeEnum } from '../../../common/enum';
import { AcquisitionMethodEnum } from '../../../common/enum';

const validPropertyDetails = {
    status: PropertyDetailsTypeEnum.SINGLE_FAMILY,
    units: [],
};

const validAcquisitionDetails = {
    method: AcquisitionMethodEnum.CASH,
    purchasePrice: 200000,
    sellerConcessions: 0,
    credits: 0,
    hasItems: false,
};

const validRepairs = {};

const validFixedExpenses = {
    sewer: 0,
    water: 0,
    trash: 0,
    gas: 0,
    electric: 0,
    internet: 0,
    other: 0,
    hoaFees: 0,
    propertyTaxes: 0,
    hazardInsurance: 0,
    additionalFees: 0,
    cashReserves: 0,
    managementFees: 0,
    maintenanceEscrow: 0,
};

function validPayload(overrides: Record<string, unknown> = {}) {
    return {
        propertyDetails: validPropertyDetails,
        acquisitionDetails: validAcquisitionDetails,
        repairs: validRepairs,
        fixedExpenses: validFixedExpenses,
        ...overrides,
    };
}

async function getErrors(data: unknown) {
    return validate(plainToInstance(CreateRaBuilderDto, data));
}

describe('CreateRaBuilderDto', () => {

    it('should pass with a fully valid payload', async () => {
        const errors = await getErrors(validPayload());
        expect(errors.length).toBe(0);
    });

    describe('propertyDetails', () => {
        it('should fail when propertyDetails.status is invalid', async () => {
            const errors = await getErrors(
                validPayload({ propertyDetails: { ...validPropertyDetails, status: 'BAD_ENUM' } }),
            );
            const nested = errors.find(e => e.property === 'propertyDetails');
            expect(nested).toBeDefined();
            expect(nested?.children?.length).toBeGreaterThan(0);
        });

        it('should pass with optional monthlyIncome provided', async () => {
            const errors = await getErrors(
                validPayload({
                    propertyDetails: { ...validPropertyDetails, monthlyIncome: 1500 },
                }),
            );
            expect(errors.length).toBe(0);
        });

        it('should fail when a nested unit has an invalid field', async () => {
            const errors = await getErrors(
                validPayload({
                    propertyDetails: {
                        ...validPropertyDetails,
                        units: [{ sqFootage: -1, bedRooms: 2, bathRooms: 1, monthlyRent: 1000 }],
                    },
                }),
            );
            const nested = errors.find(e => e.property === 'propertyDetails');
            expect(nested).toBeDefined();
        });

        it('should pass with a fully valid unit', async () => {
            const errors = await getErrors(
                validPayload({
                    propertyDetails: {
                        ...validPropertyDetails,
                        units: [{ sqFootage: 800, bedRooms: 2, bathRooms: 1, monthlyRent: 1200 }],
                    },
                }),
            );
            expect(errors.length).toBe(0);
        });
    });

    describe('acquisitionDetails', () => {
        it('should fail when acquisitionDetails.method is invalid', async () => {
            const errors = await getErrors(
                validPayload({
                    acquisitionDetails: { ...validAcquisitionDetails, method: 'INVALID' },
                }),
            );
            const nested = errors.find(e => e.property === 'acquisitionDetails');
            expect(nested?.children?.length).toBeGreaterThan(0);
        });

        it('should fail when a required field like purchasePrice is missing', async () => {
            const { purchasePrice: _, ...rest } = validAcquisitionDetails;
            const errors = await getErrors(
                validPayload({ acquisitionDetails: rest }),
            );
            const nested = errors.find(e => e.property === 'acquisitionDetails');
            expect(nested?.children?.length).toBeGreaterThan(0);
        });

        it('should pass with optional fields provided', async () => {
            const errors = await getErrors(
                validPayload({
                    acquisitionDetails: {
                        ...validAcquisitionDetails,
                        downPayment: 40000,
                        loanInterest: 5,
                        loanLength: 30,
                    },
                }),
            );
            expect(errors.length).toBe(0);
        });

        it('should pass with a valid nested item (AdItemizedDto)', async () => {
            const errors = await getErrors(
                validPayload({
                    acquisitionDetails: {
                        ...validAcquisitionDetails,
                        hasItems: true,
                        item: {
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
                        },
                    },
                }),
            );
            expect(errors.length).toBe(0);
        });

        it('should fail when nested item has an invalid field', async () => {
            const errors = await getErrors(
                validPayload({
                    acquisitionDetails: {
                        ...validAcquisitionDetails,
                        item: { originationFee: -1 },
                    },
                }),
            );
            const nested = errors.find(e => e.property === 'acquisitionDetails');
            expect(nested).toBeDefined();
        });
    });

    describe('repairs', () => {
        it('should pass with all optional repairs fields omitted', async () => {
            const errors = await getErrors(validPayload({ repairs: {} }));
            expect(errors.length).toBe(0);
        });

        it('should pass with total and afterRepairValue provided', async () => {
            const errors = await getErrors(
                validPayload({ repairs: { total: 15000, afterRepairValue: 250000 } }),
            );
            expect(errors.length).toBe(0);
        });

        it('should pass with valid eRepairs nested object', async () => {
            const errors = await getErrors(
                validPayload({
                    repairs: {
                        eRepairs: { roof: 0, landscaping: 0, concierge: 0, garage: 0, bathrooms: 0 },
                    },
                }),
            );
            expect(errors.length).toBe(0);
        });

        it('should fail when eRepairs has an invalid nested field', async () => {
            const errors = await getErrors(
                validPayload({
                    repairs: {
                        eRepairs: { roof: -100, landscaping: 0, concierge: 0, garage: 0, bathrooms: 0 },
                    },
                }),
            );
            const nested = errors.find(e => e.property === 'repairs');
            expect(nested).toBeDefined();
        });

        it('should pass with valid iRepairs and oRepairs', async () => {
            const rItem = { roof: 0, landscaping: 0, concierge: 0, garage: 0, bathrooms: 0 };
            const errors = await getErrors(
                validPayload({ repairs: { iRepairs: rItem, oRepairs: rItem } }),
            );
            expect(errors.length).toBe(0);
        });
    });

    describe('fixedExpenses', () => {
        it('should fail when a required field like sewer is missing', async () => {
            const { sewer: _, ...rest } = validFixedExpenses;
            const errors = await getErrors(validPayload({ fixedExpenses: rest }));
            const nested = errors.find(e => e.property === 'fixedExpenses');
            expect(nested?.children?.length).toBeGreaterThan(0);
        });

        it('should fail when cashReserves exceeds max of 100', async () => {
            const errors = await getErrors(
                validPayload({ fixedExpenses: { ...validFixedExpenses, cashReserves: 101 } }),
            );
            const nested = errors.find(e => e.property === 'fixedExpenses');
            expect(nested?.children?.length).toBeGreaterThan(0);
        });

        it('should fail when managementFees exceeds max of 100', async () => {
            const errors = await getErrors(
                validPayload({ fixedExpenses: { ...validFixedExpenses, managementFees: 101 } }),
            );
            const nested = errors.find(e => e.property === 'fixedExpenses');
            expect(nested?.children?.length).toBeGreaterThan(0);
        });

        it('should fail when maintenanceEscrow exceeds max of 100', async () => {
            const errors = await getErrors(
                validPayload({ fixedExpenses: { ...validFixedExpenses, maintenanceEscrow: 101 } }),
            );
            const nested = errors.find(e => e.property === 'fixedExpenses');
            expect(nested?.children?.length).toBeGreaterThan(0);
        });

        it('should pass with all fields at their boundary values', async () => {
            const errors = await getErrors(
                validPayload({
                    fixedExpenses: {
                        ...validFixedExpenses,
                        cashReserves: 100,
                        managementFees: 100,
                        maintenanceEscrow: 100,
                    },
                }),
            );
            expect(errors.length).toBe(0);
        });
    });
});
