import { FFlipSummaryService } from './f-flip-summary.service';
import { FFlipService } from './f-flip.service';
import { ABuilderEntity } from '../../a-builder/entities';
import { AcquisitionMethodEnum } from '../../../common/enum';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('FFlipSummaryService', () => {
    let service: FFlipSummaryService;
    let mockFFlipService: jest.Mocked<Partial<FFlipService>>;

    const mockCalculateLoanPointsCost = jest.fn();

    beforeEach(() => {
        mockFFlipService = {
            rAnalyzerService: {
                aBuilderService: {
                    aDetailsService: {
                        calculateLoanPointsCost: mockCalculateLoanPointsCost,
                    } as any,
                } as any,
            } as any,
        } as any;

        service = new FFlipSummaryService(mockFFlipService as FFlipService);
    });

    afterEach(() => jest.clearAllMocks());

    describe('calculateAcquisitionCost', () => {
        it('should return 0 when acquisitionDetails is missing', () => {
            const aBuilder = { acquisitionDetails: null } as any as ABuilderEntity;
            expect(service.calculateAcquisitionCost(aBuilder)).toBe(0);
        });

        it('should calculate CASH acquisition cost', () => {
            const aBuilder = {
                acquisitionDetails: {
                    purchasePrice: 300000,
                    sellerConcessions: 5000,
                    credits: 2000,
                    method: AcquisitionMethodEnum.CASH,
                },
            } as any as ABuilderEntity;

            expect(service.calculateAcquisitionCost(aBuilder)).toBe(293000);
        });

        it('should calculate CASH with no concessions or credits (defaults to 0)', () => {
            const aBuilder = {
                acquisitionDetails: {
                    purchasePrice: 200000,
                    method: AcquisitionMethodEnum.CASH,
                },
            } as any as ABuilderEntity;

            expect(service.calculateAcquisitionCost(aBuilder)).toBe(200000);
        });

        it('should calculate FINANCED acquisition cost', () => {
            mockCalculateLoanPointsCost.mockReturnValue(3000);
            const aBuilder = {
                acquisitionDetails: {
                    purchasePrice: 300000,
                    downPayment: 60000,
                    sellerConcessions: 2000,
                    credits: 1000,
                    method: AcquisitionMethodEnum.FINANCED,
                },
                sale: { saleClosingCoast: 5000 },
            } as any as ABuilderEntity;

            expect(service.calculateAcquisitionCost(aBuilder)).toBe(65000);
            expect(mockCalculateLoanPointsCost).toHaveBeenCalledWith(aBuilder.acquisitionDetails);
        });

        it('should handle FINANCED with no sale (saleClosingCoast defaults to 0)', () => {
            mockCalculateLoanPointsCost.mockReturnValue(1000);
            const aBuilder = {
                acquisitionDetails: {
                    downPayment: 50000,
                    method: AcquisitionMethodEnum.FINANCED,
                },
                sale: null,
            } as any as ABuilderEntity;

            expect(service.calculateAcquisitionCost(aBuilder)).toBe(51000);
        });

        it('should return 0 for unknown acquisition method', () => {
            const aBuilder = {
                acquisitionDetails: {
                    purchasePrice: 300000,
                    method: 'UNKNOWN' as any,
                },
            } as any as ABuilderEntity;

            expect(service.calculateAcquisitionCost(aBuilder)).toBe(0);
        });
    });

    describe('calculateHoldingCost', () => {
        it('should return 0 when hCoast is missing', () => {
            const aBuilder = { hCoast: null } as any as ABuilderEntity;
            expect(service.calculateHoldingCost(aBuilder)).toBe(0);
        });

        it('should calculate holding cost correctly', () => {
            const aBuilder = {
                hCoast: {
                    duration: 3,
                    itemized: {
                        propertyTaxes: 500,
                        insurance: 200,
                        totalUtilities: 100,
                    },
                },
            } as any as ABuilderEntity;

            expect(service.calculateHoldingCost(aBuilder)).toBe(2400);
        });

        it('should default to 0 for missing itemized fields', () => {
            const aBuilder = {
                hCoast: {
                    duration: 4,
                    itemized: {},
                },
            } as any as ABuilderEntity;

            expect(service.calculateHoldingCost(aBuilder)).toBe(0);
        });

        it('should handle null itemized', () => {
            const aBuilder = {
                hCoast: {
                    duration: 2,
                    itemized: null,
                },
            } as any as ABuilderEntity;

            expect(service.calculateHoldingCost(aBuilder)).toBe(0);
        });
    });

    describe('calculateAgentCommissionCost', () => {
        it('should return 0 when sale is missing', () => {
            const aBuilder = { sale: null } as any as ABuilderEntity;
            expect(service.calculateAgentCommissionCost(aBuilder)).toBe(0);
        });

        it('should calculate agent commission correctly', () => {
            const aBuilder = {
                acquisitionDetails: { purchasePrice: 300000 },
                sale: { agentCommission: 5 },
            } as any as ABuilderEntity;
            expect(service.calculateAgentCommissionCost(aBuilder)).toBe(15000);
        });

        it('should default to 0 for missing purchasePrice', () => {
            const aBuilder = {
                acquisitionDetails: null,
                sale: { agentCommission: 5 },
            } as any as ABuilderEntity;

            expect(service.calculateAgentCommissionCost(aBuilder)).toBe(0);
        });

        it('should default to 0 for missing agentCommission', () => {
            const aBuilder = {
                acquisitionDetails: { purchasePrice: 300000 },
                sale: { agentCommission: undefined },
            } as any as ABuilderEntity;

            expect(service.calculateAgentCommissionCost(aBuilder)).toBe(0);
        });
    });

    describe('calculateSaleCost', () => {
        it('should return 0 when sale is missing', () => {
            const aBuilder = { sale: null } as any as ABuilderEntity;
            expect(service.calculateSaleCost(aBuilder)).toBe(0);
        });

        it('should aggregate closing cost and agent commission', () => {
            const aBuilder = {
                acquisitionDetails: { purchasePrice: 300000 },
                sale: {
                    saleClosingCoast: 8000,
                    agentCommission: 3,
                },
            } as any as ABuilderEntity;

            expect(service.calculateSaleCost(aBuilder)).toBe(17000);
        });

        it('should default to 0 for missing saleClosingCoast', () => {
            const aBuilder = {
                acquisitionDetails: { purchasePrice: 200000 },
                sale: {
                    saleClosingCoast: undefined,
                    agentCommission: 5,
                },
            } as any as ABuilderEntity;

            expect(service.calculateSaleCost(aBuilder)).toBe(10000);
        });
    });

    describe('calculateTotalInvestment', () => {
        it('should return 0 when acquisitionDetails is missing', () => {
            const aBuilder = {
                acquisitionDetails: null,
                hCoast: { holdingCoast: 3000 },
                repairs: { total: 20000 },
            } as any as ABuilderEntity;
            expect(service.calculateTotalInvestment(aBuilder)).toBe(0);
        });

        it('should return 0 when hCoast is missing', () => {
            const aBuilder = {
                acquisitionDetails: { purchasePrice: 300000 },
                hCoast: null,
                repairs: { total: 20000 },
            } as any as ABuilderEntity;
            expect(service.calculateTotalInvestment(aBuilder)).toBe(0);
        });

        it('should return 0 when repairs is missing', () => {
            const aBuilder = {
                acquisitionDetails: { purchasePrice: 300000 },
                hCoast: { holdingCoast: 3000 },
                repairs: null,
            } as any as ABuilderEntity;
            expect(service.calculateTotalInvestment(aBuilder)).toBe(0);
        });

        it('should calculate total investment correctly', () => {
            const aBuilder = {
                acquisitionDetails: { purchasePrice: 300000 },
                hCoast: { holdingCoast: 9000 },
                repairs: { total: 20000 },
            } as any as ABuilderEntity;

            expect(service.calculateTotalInvestment(aBuilder)).toBe(329000);
        });

        it('should default to 0 for missing numeric fields', () => {
            const aBuilder = {
                acquisitionDetails: { purchasePrice: undefined },
                hCoast: { holdingCoast: undefined },
                repairs: { total: undefined },
            } as any as ABuilderEntity;

            expect(service.calculateTotalInvestment(aBuilder)).toBe(0);
        });
    });

    describe('calculateNetProfit', () => {
        it('should return 0 when sale is missing', () => {
            const aBuilder = { sale: null } as any as ABuilderEntity;
            expect(service.calculateNetProfit(aBuilder)).toBe(0);
        });

        it('should calculate net profit correctly', () => {
            const aBuilder = {
                acquisitionDetails: { purchasePrice: 300000 },
                hCoast: {
                    holdingCoast: 9000,
                    duration: 3,
                    itemized: { propertyTaxes: 500, insurance: 200, totalUtilities: 100 },
                },
                repairs: { total: 20000 },
                sale: {
                    afterRepairValue: 500000,
                    saleClosingCoast: 8000,
                    agentCommission: 3,
                },
            } as any as ABuilderEntity;

            const saleCost = service.calculateSaleCost(aBuilder);
            const totalInvestment = service.calculateTotalInvestment(aBuilder);
            const expected = 500000 - saleCost - totalInvestment;

            expect(service.calculateNetProfit(aBuilder)).toBe(expected);
        });
    });

    describe('calculateRoi', () => {
        it('should return 0 when total investment is 0', () => {
            const aBuilder = {
                acquisitionDetails: null,
                hCoast: null,
                repairs: null,
                sale: null,
            } as any as ABuilderEntity;
            expect(service.calculateRoi(aBuilder)).toBe(0);
        });

        it('should calculate ROI correctly', () => {
            const aBuilder = {
                acquisitionDetails: { purchasePrice: 300000 },
                hCoast: {
                    holdingCoast: 9000,
                    duration: 3,
                    itemized: { propertyTaxes: 500, insurance: 200, totalUtilities: 100 },
                },
                repairs: { total: 20000 },
                sale: {
                    afterRepairValue: 500000,
                    saleClosingCoast: 8000,
                    agentCommission: 3,
                },
            } as any as ABuilderEntity;

            const totalInvestment = service.calculateTotalInvestment(aBuilder);
            const netProfit = service.calculateNetProfit(aBuilder);
            const expected = netProfit / totalInvestment / 100;

            expect(service.calculateRoi(aBuilder)).toBe(expected);
        });
    });

    describe('calculateMaxOffer', () => {
        it('should return 0 when acquisitionDetails is missing', () => {
            const aBuilder = {
                acquisitionDetails: null,
                sale: { afterRepairValue: 500000, targetProfit: 50000 },
                fExpenses: {},
                repairs: { total: 20000 },
                hCoast: { duration: 3, holdingCoast: 9000, itemized: {} },
            } as any as ABuilderEntity;
            expect(service.calculateMaxOffer(aBuilder)).toBe(0);
        });

        it('should return 0 when sale is missing', () => {
            const aBuilder = {
                acquisitionDetails: { purchasePrice: 300000 },
                sale: null,
                fExpenses: {},
                repairs: { total: 20000 },
                hCoast: { duration: 3, holdingCoast: 9000, itemized: {} },
            } as any as ABuilderEntity;
            expect(service.calculateMaxOffer(aBuilder)).toBe(0);
        });

        it('should return 0 when fExpenses is missing', () => {
            const aBuilder = {
                acquisitionDetails: { purchasePrice: 300000 },
                sale: { afterRepairValue: 500000, targetProfit: 50000 },
                fExpenses: null,
                repairs: { total: 20000 },
                hCoast: { duration: 3, holdingCoast: 9000, itemized: {} },
            } as any as ABuilderEntity;
            expect(service.calculateMaxOffer(aBuilder)).toBe(0);
        });

        it('should return 0 when repairs is missing', () => {
            const aBuilder = {
                acquisitionDetails: { purchasePrice: 300000 },
                sale: { afterRepairValue: 500000, targetProfit: 50000 },
                fExpenses: {},
                repairs: null,
                hCoast: { duration: 3, holdingCoast: 9000, itemized: {} },
            } as any as ABuilderEntity;
            expect(service.calculateMaxOffer(aBuilder)).toBe(0);
        });

        it('should return 0 when hCoast is missing', () => {
            const aBuilder = {
                acquisitionDetails: { purchasePrice: 300000 },
                sale: { afterRepairValue: 500000, targetProfit: 50000 },
                fExpenses: {},
                repairs: { total: 20000 },
                hCoast: null,
            } as any as ABuilderEntity;
            expect(service.calculateMaxOffer(aBuilder)).toBe(0);
        });

        it('should calculate max offer correctly', () => {
            const aBuilder = {
                acquisitionDetails: {
                    purchasePrice: 300000,
                    sellerConcessions: 0,
                    credits: 0,
                    method: AcquisitionMethodEnum.CASH,
                },
                sale: {
                    afterRepairValue: 500000,
                    targetProfit: 50000,
                    saleClosingCoast: 8000,
                    agentCommission: 3,
                },
                fExpenses: {},
                repairs: { total: 20000 },
                hCoast: {
                    duration: 3,
                    holdingCoast: 9000,
                    itemized: { propertyTaxes: 500, insurance: 200, totalUtilities: 100 },
                },
            } as any as ABuilderEntity;

            const holdingCost = service.calculateHoldingCost(aBuilder);
            const saleCost = service.calculateSaleCost(aBuilder);
            const acquisitionCost = service.calculateAcquisitionCost(aBuilder);
            const expected = 500000 - 50000 - 20000 - holdingCost - saleCost - acquisitionCost;

            expect(service.calculateMaxOffer(aBuilder)).toBe(expected);
        });
    });

    describe('getProjectTimeline', () => {
        it('should return 0 when hCoast is missing', () => {
            const aBuilder = { hCoast: null } as any as ABuilderEntity;
            expect(service.getProjectTimeline(aBuilder)).toBe(0);
        });

        it('should calculate timeline correctly', () => {
            const aBuilder = {
                hCoast: { duration: 3 },
            } as any as ABuilderEntity;

            expect(service.getProjectTimeline(aBuilder)).toEqual({
                rehabDeadline: 60,
                salesTarget: 90,
            });
        });
    });

    describe('getInvestmentSummary', () => {
        it('should return the investment summary with all 3 metrics', () => {
            const aBuilder = {
                acquisitionDetails: null,
                hCoast: null,
                repairs: null,
                sale: null,
            } as any as ABuilderEntity;

            const result = service.getInvestmentSummary(aBuilder);
            expect(result).toHaveProperty('totalInvestment');
            expect(result).toHaveProperty('netProfit');
            expect(result).toHaveProperty('roi');
        });

        it('should return correct values for complete aBuilder', () => {
            const aBuilder = {
                acquisitionDetails: {
                    purchasePrice: 300000,
                    method: AcquisitionMethodEnum.CASH,
                    sellerConcessions: 0,
                    credits: 0,
                },
                hCoast: {
                    holdingCoast: 9000,
                    duration: 3,
                    itemized: { propertyTaxes: 500, insurance: 200, totalUtilities: 100 },
                },
                repairs: { total: 20000 },
                sale: { afterRepairValue: 500000, saleClosingCoast: 8000, agentCommission: 3 },
            } as any as ABuilderEntity;

            const result = service.getInvestmentSummary(aBuilder);
            expect(result.totalInvestment).toBe(service.calculateTotalInvestment(aBuilder));
            expect(result.netProfit).toBe(service.calculateNetProfit(aBuilder));
            expect(result.roi).toBe(service.calculateRoi(aBuilder));
        });
    });

    describe('getProjectProfitRow1', () => {
        it('should return correct row 1 data', () => {
            const aBuilder = {
                acquisitionDetails: {
                    purchasePrice: 300000,
                    method: AcquisitionMethodEnum.CASH,
                    sellerConcessions: 0,
                    credits: 0,
                },
                hCoast: {
                    duration: 3,
                    holdingCoast: 9000,
                    itemized: { propertyTaxes: 500, insurance: 200, totalUtilities: 100 },
                },
                repairs: { total: 20000 },
                sale: { afterRepairValue: 500000, saleClosingCoast: 8000, agentCommission: 3 },
            } as any as ABuilderEntity;

            const result = service.getProjectProfitRow1(aBuilder);
            expect(result).toHaveProperty('duration', 3);
            expect(result).toHaveProperty('holdingCoast', 9000);
            expect(result).toHaveProperty('days', 90);
            expect(result).toHaveProperty('price');
            expect(result).toHaveProperty('roi');
        });

        it('should default to 0 when hCoast or sale is missing', () => {
            const aBuilder = {
                acquisitionDetails: null,
                hCoast: null,
                repairs: null,
                sale: null,
            } as any as ABuilderEntity;

            const result = service.getProjectProfitRow1(aBuilder);
            expect(result.duration).toBe(0);
            expect(result.holdingCoast).toBe(0);
            expect(result.days).toBe(0);
        });
    });

    describe('getProjectProfitRow2', () => {
        it('should return row2 with adjusted timeline and profit', () => {
            const aBuilder = {
                acquisitionDetails: {
                    purchasePrice: 300000,
                    method: AcquisitionMethodEnum.CASH,
                    sellerConcessions: 0,
                    credits: 0,
                },
                hCoast: {
                    duration: 3,
                    holdingCoast: 9000,
                    itemized: { propertyTaxes: 500, insurance: 200, totalUtilities: 100 },
                },
                repairs: { total: 20000 },
                sale: { afterRepairValue: 500000, saleClosingCoast: 8000, agentCommission: 3 },
            } as any as ABuilderEntity;

            const row1 = service.getProjectProfitRow1(aBuilder);
            const result = service.getProjectProfitRow2(aBuilder);

            expect(result.days).toBe(row1.days + 30);
            expect(result).toHaveProperty('price');
            expect(result).toHaveProperty('roi');
        });

        it('should avoid division by zero when duration is 0', () => {
            const aBuilder = {
                acquisitionDetails: null,
                hCoast: { duration: 0, holdingCoast: 0, itemized: null },
                repairs: null,
                sale: null,
            } as any as ABuilderEntity;

            expect(() => service.getProjectProfitRow2(aBuilder)).not.toThrow();
        });
    });

    describe('getProjectProfitRow3', () => {
        it('should return row3 with further adjusted timeline and profit', () => {
            const aBuilder = {
                acquisitionDetails: {
                    purchasePrice: 300000,
                    method: AcquisitionMethodEnum.CASH,
                    sellerConcessions: 0,
                    credits: 0,
                },
                hCoast: {
                    duration: 3,
                    holdingCoast: 9000,
                    itemized: { propertyTaxes: 500, insurance: 200, totalUtilities: 100 },
                },
                repairs: { total: 20000 },
                sale: { afterRepairValue: 500000, saleClosingCoast: 8000, agentCommission: 3 },
            } as any as ABuilderEntity;

            const row2 = service.getProjectProfitRow2(aBuilder);
            const result = service.getProjectProfitRow3(aBuilder);

            expect(result.days).toBe(row2.days + 30);
            expect(result).toHaveProperty('price');
            expect(result).toHaveProperty('roi');
        });

        it('should avoid division by zero when duration is 0 in row3', () => {
            const aBuilder = {
                acquisitionDetails: null,
                hCoast: { duration: 0, holdingCoast: 0, itemized: null },
                repairs: null,
                sale: null,
            } as any as ABuilderEntity;

            expect(() => service.getProjectProfitRow3(aBuilder)).not.toThrow();
        });
    });

    describe('getProjectProfits', () => {
        it('should return all 3 rows with days, price, and roi', () => {
            const aBuilder = {
                acquisitionDetails: {
                    purchasePrice: 300000,
                    method: AcquisitionMethodEnum.CASH,
                    sellerConcessions: 0,
                    credits: 0,
                },
                hCoast: {
                    duration: 3,
                    holdingCoast: 9000,
                    itemized: { propertyTaxes: 500, insurance: 200, totalUtilities: 100 },
                },
                repairs: { total: 20000 },
                sale: { afterRepairValue: 500000, saleClosingCoast: 8000, agentCommission: 3 },
            } as any as ABuilderEntity;

            const result = service.getProjectProfits(aBuilder);

            expect(result).toHaveProperty('row1');
            expect(result).toHaveProperty('row2');
            expect(result).toHaveProperty('row3');

            for (const row of [result.row1, result.row2, result.row3]) {
                expect(row).toHaveProperty('days');
                expect(row).toHaveProperty('price');
                expect(row).toHaveProperty('roi');
                // Should NOT contain extra fields like duration or holdingCoast
                expect(row).not.toHaveProperty('duration');
                expect(row).not.toHaveProperty('holdingCoast');
            }
        });
    });
});
