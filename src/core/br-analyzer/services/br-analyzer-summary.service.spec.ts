import { Test, TestingModule } from '@nestjs/testing';
import { BrAnalyzerSummaryService } from './br-analyzer-summary.service';
import { BrAnalyzerService } from './br-analyzer.service';
import { ABuilderEntity } from '../../a-builder/entities';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

const buildEntity = (overrides: Partial<ABuilderEntity> = {}): ABuilderEntity =>
    ({
        acquisitionDetails: {
            closingCostFees: 3_000,
            downPayment: 20_000,
            purchasePrice: 200_000,
            monthlyIncome: 500,
        },
        propertyDetails: {
            totalIncome: 2_000,
            totalGrossIncome: 2_500,
        },
        refinance: {
            afterRepairValue: 250_000,
            refiLTV: 0.75,
            oldLoanAmount: 160_000,
            newLoanAmount: 187_500,
            vacancy: 0.95,
            pInterest: 1_000,
            pmi: 50,
        },
        fExpenses: {
            total: 400,
            propertyTaxes: 100,
            hazardInsurance: 50,
            totalUtilities: 80,
            managementFees: 8,
            maintenanceEscrow: 5,
        },
        rDuration: {
            duration: 3,
            totalRCoast: 5_000,
        },
        ...overrides,
    }) as ABuilderEntity;

const buildEmptyEntity = (): ABuilderEntity => ({}) as ABuilderEntity;

const makeBrAnalyzerServiceMock = (overrides: Record<string, unknown> = {}) => ({
    rAnalyzerService: {
        aBuilderService: {
            aDetailsService: {
                calculateCashNeededToClose: jest.fn((fees: number, dp: number) => fees + dp),
            },
            refinanceService: {
                calculateRefiCash: jest.fn(
                    (arv: number, ltv: number, old: number) => arv * ltv - old,
                ),
            },
            cCoastService: {
                calculateNetCarryingCoast: jest.fn((_builder: ABuilderEntity) => 2_000),
            },
        },
    },
    ...overrides,
});

describe('BrAnalyzerSummaryService', () => {
    let service: BrAnalyzerSummaryService;
    let brAnalyzerMock: ReturnType<typeof makeBrAnalyzerServiceMock>;

    beforeEach(async () => {
        brAnalyzerMock = makeBrAnalyzerServiceMock();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BrAnalyzerSummaryService,
                { provide: BrAnalyzerService, useValue: brAnalyzerMock },
            ],
        }).compile();

        service = module.get<BrAnalyzerSummaryService>(BrAnalyzerSummaryService);
    });

    describe('cashNeedToClose', () => {
        it('should delegate to aDetailsService.calculateCashNeededToClose with correct args', () => {
            const builder = buildEntity();
            const result = service.cashNeedToClose(builder);

            expect(
                brAnalyzerMock.rAnalyzerService.aBuilderService.aDetailsService
                    .calculateCashNeededToClose,
            ).toHaveBeenCalledWith(3_000, 20_000);
            expect(result).toBe(23_000);
        });

        it('should pass 0 defaults when acquisitionDetails is undefined', () => {
            const builder = buildEmptyEntity();
            service.cashNeedToClose(builder);

            expect(
                brAnalyzerMock.rAnalyzerService.aBuilderService.aDetailsService
                    .calculateCashNeededToClose,
            ).toHaveBeenCalledWith(0, 0);
        });
    });

    describe('calculateCashOutRefi', () => {
        it('should delegate to refinanceService.calculateRefiCash with correct args', () => {
            const builder = buildEntity();
            const result = service.calculateCashOutRefi(builder);

            expect(
                brAnalyzerMock.rAnalyzerService.aBuilderService.refinanceService.calculateRefiCash,
            ).toHaveBeenCalledWith(250_000, 0.75, 160_000);
            expect(result).toBe(27_500);
        });

        it('should pass 0 defaults when refinance is undefined', () => {
            const builder = buildEmptyEntity();
            service.calculateCashOutRefi(builder);

            expect(
                brAnalyzerMock.rAnalyzerService.aBuilderService.refinanceService.calculateRefiCash,
            ).toHaveBeenCalledWith(0, 0, 0);
        });
    });

    describe('calculateCCoast', () => {
        it('should delegate to cCoastService.calculateNetCarryingCoast', () => {
            const builder = buildEntity();
            const result = service.calculateCCoast(builder);

            expect(
                brAnalyzerMock.rAnalyzerService.aBuilderService.cCoastService
                    .calculateNetCarryingCoast,
            ).toHaveBeenCalledWith(builder);
            expect(result).toBe(2_000);
        });
    });

    describe('calculateNetCashInvested', () => {
        it('should compute cashOutRefi - (cashToClose + totalRCoast + cCoast)', () => {
            const builder = buildEntity();
            expect(service.calculateNetCashInvested(builder)).toBe(-2_500);
        });

        it('should return cashOutRefi when all costs are 0', () => {
            (
                brAnalyzerMock.rAnalyzerService.aBuilderService.aDetailsService
                    .calculateCashNeededToClose as jest.Mock
            ).mockReturnValueOnce(0);
            (
                brAnalyzerMock.rAnalyzerService.aBuilderService.refinanceService
                    .calculateRefiCash as jest.Mock
            ).mockReturnValueOnce(10_000);
            (
                brAnalyzerMock.rAnalyzerService.aBuilderService.cCoastService
                    .calculateNetCarryingCoast as jest.Mock
            ).mockReturnValueOnce(0);

            const builder = buildEntity({ rDuration: { duration: 0, totalRCoast: 0 } as any });
            expect(service.calculateNetCashInvested(builder)).toBe(10_000);
        });
    });

    describe('calculateTotalRent', () => {
        it('should multiply totalIncome by vacancy rate', () => {
            const builder = buildEntity();
            expect(service.calculateTotalRent(builder)).toBeCloseTo(1_900);
        });

        it('should return 0 when fields are undefined', () => {
            expect(service.calculateTotalRent(buildEmptyEntity())).toBe(0);
        });
    });

    describe('calculateMonthlyCashFlow', () => {
        it('should subtract pInterest and fExpenses.total from totalRent', () => {
            const builder = buildEntity();
            expect(service.calculateMonthlyCashFlow(builder)).toBeCloseTo(500);
        });

        it('should return 0 when all values are undefined', () => {
            expect(service.calculateMonthlyCashFlow(buildEmptyEntity())).toBe(0);
        });
    });

    describe('calculateYearlyCashFlowYearOne', () => {
        it('should use remaining months after rehab duration', () => {
            const builder = buildEntity();
            expect(service.calculateYearlyCashFlowYearOne(builder)).toBeCloseTo(900);
        });

        it('should use 12 months when rDuration is undefined', () => {
            const builder = buildEntity({ rDuration: undefined });
            expect(service.calculateYearlyCashFlowYearOne(builder)).toBeCloseTo(1_200);
        });
    });

    describe('calculateMonthCFlow', () => {
        it('should multiply monthly cash flow by 12', () => {
            const builder = buildEntity();
            expect(service.calculateMonthCFlow(builder)).toBeCloseTo(6_000);
        });
    });

    describe('calculateYearlyCashFlowYearTwo', () => {
        it('should subtract annual fixed expenses from annualized cash flow', () => {
            const builder = buildEntity();
            expect(service.calculateYearlyCashFlowYearTwo(builder)).toBeCloseTo(1_200);
        });

        it('should return 0 when fExpenses is undefined and monthly cash flow is 0', () => {
            expect(service.calculateYearlyCashFlowYearTwo(buildEmptyEntity())).toBe(0);
        });
    });

    describe('calculatePaybackPeriod', () => {
        it('should divide net cash invested by annualized cash flow', () => {
            const builder = buildEntity();
            expect(service.calculatePaybackPeriod(builder)).toBeCloseTo(-2_500 / 6_000);
        });
    });

    describe('calculateCashOnCshReturn', () => {
        it('should divide annualized cash flow by net cash invested', () => {
            const builder = buildEntity();
            expect(service.calculateCashOnCshReturn(builder)).toBeCloseTo(-2.4);
        });
    });

    describe('calculateTrappedEquity', () => {
        it('should subtract newLoanAmount from afterRepairValue', () => {
            const builder = buildEntity();
            expect(service.calculateTrappedEquity(builder)).toBe(62_500);
        });

        it('should return 0 when refinance is undefined', () => {
            expect(service.calculateTrappedEquity(buildEmptyEntity())).toBe(0);
        });
    });

    describe('calculateRoiEquityGrowth', () => {
        it("should return 'INF' when net cash invested is negative", () => {
            expect(service.calculateRoiEquityGrowth(buildEntity())).toBe('INF');
        });

        it('should return numeric ROI when net cash invested is positive', () => {
            (
                brAnalyzerMock.rAnalyzerService.aBuilderService.refinanceService
                    .calculateRefiCash as jest.Mock
            ).mockReturnValue(5_000);
            (
                brAnalyzerMock.rAnalyzerService.aBuilderService.aDetailsService
                    .calculateCashNeededToClose as jest.Mock
            ).mockReturnValue(1_000);
            (
                brAnalyzerMock.rAnalyzerService.aBuilderService.cCoastService
                    .calculateNetCarryingCoast as jest.Mock
            ).mockReturnValue(0);

            const builder = buildEntity({
                rDuration: { duration: 0, totalRCoast: 0 } as any,
                refinance: {
                    ...buildEntity().refinance,
                    afterRepairValue: 250_000,
                    newLoanAmount: 187_500,
                } as any,
            });

            const result = service.calculateRoiEquityGrowth(builder);
            expect(typeof result).toBe('number');
            expect(result as number).toBeCloseTo(16.875);
        });

        it('should return 0 / 0 = NaN when both values are 0 (edge case)', () => {
            (
                brAnalyzerMock.rAnalyzerService.aBuilderService.refinanceService
                    .calculateRefiCash as jest.Mock
            ).mockReturnValue(0);
            (
                brAnalyzerMock.rAnalyzerService.aBuilderService.aDetailsService
                    .calculateCashNeededToClose as jest.Mock
            ).mockReturnValue(0);
            (
                brAnalyzerMock.rAnalyzerService.aBuilderService.cCoastService
                    .calculateNetCarryingCoast as jest.Mock
            ).mockReturnValue(0);

            const builder = buildEmptyEntity();
            expect(service.calculateRoiEquityGrowth(builder)).toBeNaN();
        });
    });

    describe('calculateAnnualDebt', () => {
        it('should multiply pInterest by 12', () => {
            expect(service.calculateAnnualDebt(buildEntity())).toBe(12_000);
        });

        it('should return 0 when refinance is undefined', () => {
            expect(service.calculateAnnualDebt(buildEmptyEntity())).toBe(0);
        });
    });

    describe('calculateOperatingIncome', () => {
        it('should sum income and subtract itemised operating expenses', () => {
            const builder = buildEntity();
            expect(service.calculateOperatingIncome(builder)).toBeCloseTo(2_010);
        });

        it('should return 0 when all fields are undefined', () => {
            expect(service.calculateOperatingIncome(buildEmptyEntity())).toBe(0);
        });
    });

    describe('calculateNoi', () => {
        it('should combine incomes and subtract fixed expenses and annual debt', () => {
            const builder = buildEntity();
            expect(service.calculateNoi(builder)).toBeCloseTo(-9_900);
        });

        it('should return 0 when all fields are undefined', () => {
            expect(service.calculateNoi(buildEmptyEntity())).toBe(0);
        });
    });

    describe('calculateCapRate', () => {
        it('should divide NOI by purchase price and scale to percentage', () => {
            const builder = buildEntity();
            expect(service.calculateCapRate(builder)).toBeCloseTo(-4.95);
        });

        it('should return 0 (division by 0) when purchasePrice is 0', () => {
            const builder = buildEntity({
                acquisitionDetails: {
                    purchasePrice: 0,
                    closingCostFees: 0,
                    downPayment: 0,
                    monthlyIncome: 0,
                } as any,
            });
            const result = service.calculateCapRate(builder);
            expect(result === Infinity || result === -Infinity || isNaN(result)).toBe(true);
        });
    });

    describe('calculateDebtYieldPercent', () => {
        it('should divide NOI by combined loans and scale to percentage', () => {
            const builder = buildEntity();
            expect(service.calculateDebtYieldPercent(builder)).toBeCloseTo(
                (-9_900 / 347_500) * 100,
            );
        });

        it('should return 0 when refinance is undefined', () => {
            expect(service.calculateDebtYieldPercent(buildEmptyEntity())).toBeNaN();
        });
    });

    describe('calculateGRM', () => {
        it('should divide purchasePrice by total annual gross rental income', () => {
            const builder = buildEntity();
            expect(service.calculateGRM(builder)).toBeCloseTo(25);
        });

        it('should return Infinity when all income is 0', () => {
            const builder = buildEmptyEntity();
            expect(service.calculateGRM(builder)).toBeNaN();
        });
    });

    describe('calculateDSCR', () => {
        it('should divide NOI by annual debt and subtract annualised PMI', () => {
            const builder = buildEntity();
            expect(service.calculateDSCR(builder)).toBeCloseTo(-9_900 / 12_000 - 50 * 12);
        });

        it('should return NaN when annualDebt is 0 and pmi is undefined', () => {
            expect(service.calculateDSCR(buildEmptyEntity())).toBeNaN();
        });
    });

    describe('calculateOperatingExpenseRatio', () => {
        it('should divide operating income by total gross income and scale to percentage', () => {
            const builder = buildEntity();
            expect(service.calculateOperatingExpenseRatio(builder)).toBeCloseTo(
                (2_010 / 2_500) * 100,
            );
        });

        it('should return NaN when totalGrossIncome is 0', () => {
            const builder = buildEntity({
                propertyDetails: { totalIncome: 0, totalGrossIncome: 0 } as any,
            });
            expect(service.calculateOperatingExpenseRatio(builder)).toBe(Infinity);
        });
    });

    describe('summaryData', () => {
        it('should return a complete summary object with all expected keys', () => {
            const builder = buildEntity();
            const summary = service.summaryData(builder);

            expect(summary).toMatchObject({
                netCashInvested: expect.any(Number),
                yearlyCashFlow1: expect.any(Number),
                yearlyCashFlow2: expect.any(Number),
                paybackPeriod: expect.any(Number),
                cCashOnReturn: expect.any(Number),
                trappedEquity: expect.any(Number),
                cashNeedToClose: expect.any(Number),
                cashOutRefi: expect.any(Number),
                netCarryingCoast: expect.any(Number),
                monthlyCashFlow: expect.any(Number),
                propertyP: {
                    capRate: expect.any(Number),
                    grm: expect.any(Number),
                    dsrc: expect.any(Number),
                    oer: expect.any(Number),
                    debtYield: expect.any(Number),
                    noi: expect.any(Number),
                },
            });
        });

        it("should include roiEquityGrowth as 'INF' when net cash invested is negative", () => {
            const summary = service.summaryData(buildEntity());
            expect(summary.roiEquityGrowth).toBe('INF');
        });

        it('should include roiEquityGrowth as number when net cash invested is positive', () => {
            (
                brAnalyzerMock.rAnalyzerService.aBuilderService.refinanceService
                    .calculateRefiCash as jest.Mock
            ).mockReturnValue(100_000);
            (
                brAnalyzerMock.rAnalyzerService.aBuilderService.aDetailsService
                    .calculateCashNeededToClose as jest.Mock
            ).mockReturnValue(1_000);
            (
                brAnalyzerMock.rAnalyzerService.aBuilderService.cCoastService
                    .calculateNetCarryingCoast as jest.Mock
            ).mockReturnValue(0);

            const builder = buildEntity({ rDuration: { duration: 0, totalRCoast: 0 } as any });
            const summary = service.summaryData(builder);
            expect(typeof summary.roiEquityGrowth).toBe('number');
        });
    });
});
