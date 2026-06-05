import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateBrBuilderDto } from './create-br-builder.dto';
import { PropertyDetailsTypeEnum } from '../../../common/enum';
import { AcquisitionMethodEnum } from '../../../common/enum';

const validRItem = {
    roof: 100,
    landscaping: 100,
    concierge: 100,
    garage: 100,
    bathrooms: 100,
};

const validPropertyDetails = {
    status: PropertyDetailsTypeEnum.SINGLE_FAMILY,
    monthlyIncome: 1000,
    units: [{ sqFootage: 100, bedRooms: 2, bathRooms: 1, monthlyRent: 500 }],
};

const validAcquisitionDetails = {
    method: AcquisitionMethodEnum.CASH,
    purchasePrice: 100000,
    sellerConcessions: 0,
    credits: 0,
    hasItems: true,
};

const validRepairs = {
    total: 5000,
    afterRepairValue: 150000,
};

const validCCoast = {
    rContingency: 10,
    duration: 6,
    hasItems: true,
};

const validFixedExpenses = {
    sewer: 50,
    water: 50,
    trash: 30,
    gas: 40,
    electric: 80,
    internet: 60,
    other: 20,
    hoaFees: 100,
    propertyTaxes: 200,
    hazardInsurance: 150,
    additionalFees: 50,
    cashReserves: 5,
    managementFees: 8,
    maintenanceEscrow: 10,
};

const validRefi = {
    afterRepairValue: 150000,
    refiLTV: 75,
    oldLoanAmount: 112500,
    pInterest: 600,
    interestRate: 5,
    pmi: 0,
    point: 1,
    hasItems: true,
};

function buildDto(overrides: Record<string, unknown> = {}): CreateBrBuilderDto {
    return plainToInstance(CreateBrBuilderDto, {
        propertyDetails: validPropertyDetails,
        acquisitionDetails: validAcquisitionDetails,
        repairs: validRepairs,
        cCoast: validCCoast,
        fixedExpenses: validFixedExpenses,
        refi: validRefi,
        ...overrides,
    });
}

describe('CreateBrBuilderDto', () => {
    describe('valid payload', () => {
        it('should pass with all required fields', async () => {
            const dto = buildDto();
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should pass with optional nested sub-fields filled (repairs items)', async () => {
            const dto = buildDto({
                repairs: {
                    ...validRepairs,
                    eRepairs: validRItem,
                    iRepairs: validRItem,
                    oRepairs: validRItem,
                },
            });
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should pass with optional nested sub-fields filled (cCoast items)', async () => {
            const dto = buildDto({
                cCoast: {
                    ...validCCoast,
                    holdingCoast: 3000,
                    eRepairs: validRItem,
                    iRepairs: validRItem,
                    oRepairs: validRItem,
                },
            });
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should pass with optional nested sub-fields filled (refi items)', async () => {
            const dto = buildDto({
                refi: {
                    ...validRefi,
                    closingCoast: 2000,
                    eRepairs: validRItem,
                    iRepairs: validRItem,
                    oRepairs: validRItem,
                },
            });
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should pass with FINANCED acquisition method and optional fields', async () => {
            const dto = buildDto({
                acquisitionDetails: {
                    ...validAcquisitionDetails,
                    method: AcquisitionMethodEnum.FINANCED,
                    downPayment: 20000,
                    loanInterest: 5,
                    points: 1,
                    loanLength: 30,
                    acquisitionCoast: 5000,
                    earnestMoneyDeposit: 1000,
                    closingCostFees: 3000,
                    holdingPeriod: 6,
                    othersFees: 500,
                    item: {
                        originationFee: 100,
                        hazardInsurance: 100,
                        floodInsurance: 100,
                        propertyTaxes: 100,
                        annualAssessment: 100,
                        escrowFees: 100,
                        attorneyFees: 100,
                        inspectionFees: 100,
                        lenderFees: 100,
                        recordingFees: 100,
                        appraisal: 100,
                        transferTax: 100,
                        other: 100,
                    },
                },
            });
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should pass with MULTI_FAMILY property type', async () => {
            const dto = buildDto({
                propertyDetails: {
                    ...validPropertyDetails,
                    status: PropertyDetailsTypeEnum.MULTI_FAMILY,
                    units: [
                        { sqFootage: 80, bedRooms: 1, bathRooms: 1, monthlyRent: 400 },
                        { sqFootage: 120, bedRooms: 3, bathRooms: 2, monthlyRent: 800 },
                    ],
                },
            });
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });
    });

    describe('missing required top-level fields', () => {
        it('should fail when propertyDetails is missing', async () => {
            const dto = buildDto({ propertyDetails: undefined });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'propertyDetails')).toBe(false);
        });

        it('should fail when acquisitionDetails is missing', async () => {
            const dto = buildDto({ acquisitionDetails: undefined });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'acquisitionDetails')).toBe(false);
        });

        it('should fail when repairs is missing', async () => {
            const dto = buildDto({ repairs: undefined });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'repairs')).toBe(false);
        });

        it('should fail when cCoast is missing', async () => {
            const dto = buildDto({ cCoast: undefined });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'cCoast')).toBe(false);
        });

        it('should fail when fixedExpenses is missing', async () => {
            const dto = buildDto({ fixedExpenses: undefined });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'fixedExpenses')).toBe(false);
        });

        it('should fail when refi is missing', async () => {
            const dto = buildDto({ refi: undefined });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'refi')).toBe(false);
        });
    });

    describe('nested validation propagation', () => {
        it('should fail and report propertyDetails errors when status is invalid', async () => {
            const dto = buildDto({
                propertyDetails: { ...validPropertyDetails, status: 'INVALID_STATUS' },
            });
            const errors = await validate(dto);
            const pdError = errors.find((e) => e.property === 'propertyDetails');
            expect(pdError).toBeDefined();
            expect(pdError?.children?.length).toBeGreaterThan(0);
        });

        it('should fail and report acquisitionDetails errors when method is invalid', async () => {
            const dto = buildDto({
                acquisitionDetails: { ...validAcquisitionDetails, method: 'INVALID' },
            });
            const errors = await validate(dto);
            const adError = errors.find((e) => e.property === 'acquisitionDetails');
            expect(adError).toBeDefined();
            expect(adError?.children?.length).toBeGreaterThan(0);
        });

        it('should fail and report cCoast errors when rContingency is above 100', async () => {
            const dto = buildDto({
                cCoast: { ...validCCoast, rContingency: 200 },
            });
            const errors = await validate(dto);
            const ccError = errors.find((e) => e.property === 'cCoast');
            expect(ccError).toBeDefined();
            expect(ccError?.children?.length).toBeGreaterThan(0);
        });

        it('should fail and report fixedExpenses errors when cashReserves is above 100', async () => {
            const dto = buildDto({
                fixedExpenses: { ...validFixedExpenses, cashReserves: 200 },
            });
            const errors = await validate(dto);
            const feError = errors.find((e) => e.property === 'fixedExpenses');
            expect(feError).toBeDefined();
            expect(feError?.children?.length).toBeGreaterThan(0);
        });

        it('should fail and report refi errors when refiLTV is above 100', async () => {
            const dto = buildDto({
                refi: { ...validRefi, refiLTV: 200 },
            });
            const errors = await validate(dto);
            const refiError = errors.find((e) => e.property === 'refi');
            expect(refiError).toBeDefined();
            expect(refiError?.children?.length).toBeGreaterThan(0);
        });
    });

    describe('plainToInstance transformation', () => {
        it('should correctly transform a plain object into a CreateBrBuilderDto instance', () => {
            const dto = buildDto();
            expect(dto).toBeInstanceOf(CreateBrBuilderDto);
        });

        it('should correctly transform nested objects into their respective DTO instances', () => {
            const dto = buildDto();
            expect(dto.propertyDetails).toBeDefined();
            expect(dto.acquisitionDetails).toBeDefined();
            expect(dto.repairs).toBeDefined();
            expect(dto.cCoast).toBeDefined();
            expect(dto.fixedExpenses).toBeDefined();
            expect(dto.refi).toBeDefined();
        });
    });
});
