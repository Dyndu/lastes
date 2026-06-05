import { Test, TestingModule } from '@nestjs/testing';
import { BrAnalyzerController } from './br-analyzer.controller';
import { BrAnalyzerService } from './services';
import { CurrentUserInterface } from '../../interface';
import { EnvConfigService } from '../../utils/services/config';
import { ErrorHandlerService } from '../../common/response';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard, PermissionsGuard } from '../../common/guard';
import {
    CreatePDetailsDto,
    ADetailsDto,
    CreateRepairsDto,
    FExpenseDto,
    BrRefiDto,
    CCoastDto,
} from '../a-builder/dto';
import { CreateBrBuilderDto } from './dto/create-br-builder.dto';
import { PropertyDetailsTypeEnum, AcquisitionMethodEnum } from '../../common/enum';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

const mockCalculateCashNeededToClose = jest.fn();

const mockBrAnalyzerService = {
    getBrAnalyzerFullBreakdown: jest.fn(),
    getBrAnalyzerAnalysisBuilder: jest.fn(),
    resolveBrAnalyzerBuilder: jest.fn(),
    rAnalyzerService: {
        aBuilderService: {
            aDetailsService: {
                calculateCashNeededToClose: mockCalculateCashNeededToClose,
            },
        },
    },
};

const mockUser: CurrentUserInterface = {
    id: 'user-uuid-1234',
    role: 'user',
    sessionId: 'session-uuid-5678',
    permissions: {},
} as unknown as CurrentUserInterface;

const mockUUID = '2908dec0-a048-4a29-9810-e730e48a057b';

const createPDetailsDto: CreatePDetailsDto = {
    status: PropertyDetailsTypeEnum.SINGLE_FAMILY,
    monthlyIncome: 3000,
    units: [{ sqFootage: 1200, bedRooms: 3, bathRooms: 2, monthlyRent: 1500 }],
};

const aDetailsDto: ADetailsDto = {
    method: AcquisitionMethodEnum.CASH,
    purchasePrice: 250000,
    sellerConcessions: 5000,
    credits: 2000,
    hasItems: false,
};

const createRepairsDto: CreateRepairsDto = {
    total: 30000,
    eRepairs: { roof: 5000, landscaping: 2000, concierge: 1000, garage: 3000, bathrooms: 4000 },
    iRepairs: { roof: 0, landscaping: 0, concierge: 1500, garage: 0, bathrooms: 2500 },
    oRepairs: { roof: 0, landscaping: 500, concierge: 0, garage: 0, bathrooms: 0 },
};

const fExpenseDto: FExpenseDto = {
    sewer: 100,
    water: 80,
    trash: 50,
    gas: 120,
    electric: 150,
    internet: 60,
    other: 30,
    hoaFees: 200,
    propertyTaxes: 500,
    hazardInsurance: 300,
    additionalFees: 75,
    cashReserves: 400,
    managementFees: 250,
    maintenanceEscrow: 180,
};

const cCoastDto: CCoastDto = {
    rContingency: 10,
    duration: 6,
    hasItems: false,
};

const refiDto: BrRefiDto = {
    afterRepairValue: 300000,
    refiLTV: 75,
    oldLoanAmount: 200000,
    pInterest: 1200,
    interestRate: 6.5,
    pmi: 150,
    point: 1,
    hasItems: false,
};

const createBrBuilderDto: CreateBrBuilderDto = {
    propertyDetails: createPDetailsDto,
    acquisitionDetails: aDetailsDto,
    repairs: createRepairsDto,
    cCoast: cCoastDto,
    fixedExpenses: fExpenseDto,
    refi: refiDto,
};

describe('BrAnalyzerController', () => {
    let controller: BrAnalyzerController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [BrAnalyzerController],
            providers: [
                { provide: BrAnalyzerService, useValue: mockBrAnalyzerService },
                {
                    provide: EnvConfigService,
                    useValue: {
                        sAdminRole: 'superadmin',
                        adminRole: 'admin',
                        userRole: 'user',
                        supportRole: 'support',
                    },
                },
                {
                    provide: ErrorHandlerService,
                    useValue: {
                        forbidden: jest.fn((_msg, userMsg) => {
                            throw new Error(userMsg);
                        }),
                    },
                },
                { provide: Reflector, useValue: { get: jest.fn() } },
                { provide: JwtAuthGuard, useValue: { canActivate: jest.fn(() => true) } },
                { provide: PermissionsGuard, useValue: { canActivate: jest.fn(() => true) } },
            ],
        }).compile();

        controller = module.get<BrAnalyzerController>(BrAnalyzerController);
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getBrAnalyzerFullSummary', () => {
        it('should call getBrAnalyzerFullBreakdown with user and id and return result', async () => {
            const expected = { section: 'builder', summary: 'summary' };
            mockBrAnalyzerService.getBrAnalyzerFullBreakdown.mockResolvedValue(expected);

            const result = await controller.getBrAnalyzerFullSummary(mockUser, mockUUID);

            expect(mockBrAnalyzerService.getBrAnalyzerFullBreakdown).toHaveBeenCalledWith(
                mockUser,
                mockUUID,
            );
            expect(result).toEqual(expected);
        });

        it('should propagate errors from the service', async () => {
            mockBrAnalyzerService.getBrAnalyzerFullBreakdown.mockRejectedValue(
                new Error('Builder incomplete'),
            );

            await expect(controller.getBrAnalyzerFullSummary(mockUser, mockUUID)).rejects.toThrow(
                'Builder incomplete',
            );
        });
    });

    describe('getBrAnalyzerAnalysisBuilder', () => {
        it('should call getBrAnalyzerAnalysisBuilder with user and id and return result', async () => {
            const expected = { idAnalysis: mockUUID, propertyDetails: null };
            mockBrAnalyzerService.getBrAnalyzerAnalysisBuilder.mockResolvedValue(expected);

            const result = await controller.getBrAnalyzerAnalysisBuilder(mockUser, mockUUID);

            expect(mockBrAnalyzerService.getBrAnalyzerAnalysisBuilder).toHaveBeenCalledWith(
                mockUser,
                mockUUID,
            );
            expect(result).toEqual(expected);
        });

        it('should return null when no builder exists', async () => {
            mockBrAnalyzerService.getBrAnalyzerAnalysisBuilder.mockResolvedValue(null);

            const result = await controller.getBrAnalyzerAnalysisBuilder(mockUser, mockUUID);

            expect(result).toBeNull();
        });

        it('should propagate errors from the service', async () => {
            mockBrAnalyzerService.getBrAnalyzerAnalysisBuilder.mockRejectedValue(
                new Error('Analysis not found'),
            );

            await expect(
                controller.getBrAnalyzerAnalysisBuilder(mockUser, mockUUID),
            ).rejects.toThrow('Analysis not found');
        });
    });

    describe('resolveBrrrAnalyzerBuilder', () => {
        it('should call resolveBrAnalyzerBuilder with user, id and dto and return result', async () => {
            const expected = { idAnalysis: mockUUID };
            mockBrAnalyzerService.resolveBrAnalyzerBuilder.mockResolvedValue(expected);

            const result = await controller.resolveBrrrAnalyzerBuilder(
                mockUser,
                mockUUID,
                createBrBuilderDto,
            );

            expect(mockBrAnalyzerService.resolveBrAnalyzerBuilder).toHaveBeenCalledWith(
                mockUser,
                mockUUID,
                createBrBuilderDto,
            );
            expect(result).toEqual(expected);
        });

        it('should work with MULTI_FAMILY property type', async () => {
            const multiDto: CreateBrBuilderDto = {
                ...createBrBuilderDto,
                propertyDetails: {
                    ...createPDetailsDto,
                    status: PropertyDetailsTypeEnum.MULTI_FAMILY,
                },
            };
            mockBrAnalyzerService.resolveBrAnalyzerBuilder.mockResolvedValue({
                idAnalysis: mockUUID,
            });

            await controller.resolveBrrrAnalyzerBuilder(mockUser, mockUUID, multiDto);

            expect(mockBrAnalyzerService.resolveBrAnalyzerBuilder).toHaveBeenCalledWith(
                mockUser,
                mockUUID,
                multiDto,
            );
        });

        it('should work with FINANCED acquisition method', async () => {
            const financedDto: CreateBrBuilderDto = {
                ...createBrBuilderDto,
                acquisitionDetails: {
                    ...aDetailsDto,
                    method: AcquisitionMethodEnum.FINANCED,
                    downPayment: 50000,
                },
            };
            mockBrAnalyzerService.resolveBrAnalyzerBuilder.mockResolvedValue({
                idAnalysis: mockUUID,
            });

            await controller.resolveBrrrAnalyzerBuilder(mockUser, mockUUID, financedDto);

            expect(mockBrAnalyzerService.resolveBrAnalyzerBuilder).toHaveBeenCalledWith(
                mockUser,
                mockUUID,
                financedDto,
            );
        });

        it('should work with optional refi fields', async () => {
            const fullRefiDto: CreateBrBuilderDto = {
                ...createBrBuilderDto,
                refi: {
                    ...refiDto,
                    closingCoast: 3000,
                    eRepairs: { roof: 1000, landscaping: 0, concierge: 0, garage: 0, bathrooms: 0 },
                    iRepairs: { roof: 0, landscaping: 0, concierge: 500, garage: 0, bathrooms: 0 },
                    oRepairs: { roof: 0, landscaping: 200, concierge: 0, garage: 0, bathrooms: 0 },
                },
            };
            mockBrAnalyzerService.resolveBrAnalyzerBuilder.mockResolvedValue({
                idAnalysis: mockUUID,
            });

            await controller.resolveBrrrAnalyzerBuilder(mockUser, mockUUID, fullRefiDto);

            expect(mockBrAnalyzerService.resolveBrAnalyzerBuilder).toHaveBeenCalledWith(
                mockUser,
                mockUUID,
                fullRefiDto,
            );
        });

        it('should propagate errors from the service', async () => {
            mockBrAnalyzerService.resolveBrAnalyzerBuilder.mockRejectedValue(
                new Error('Analysis not found'),
            );

            await expect(
                controller.resolveBrrrAnalyzerBuilder(mockUser, mockUUID, createBrBuilderDto),
            ).rejects.toThrow('Analysis not found');
        });
    });

    describe('cashToClose', () => {
        it('should call calculateCashNeededToClose with closingCostFees and downPayment and return result', async () => {
            const expected = { cashNeeded: 55000 };
            mockCalculateCashNeededToClose.mockReturnValue(expected);

            const dto: ADetailsDto = {
                ...aDetailsDto,
                closingCostFees: 5000,
                downPayment: 50000,
            };

            const result = await controller.cashToClose(dto);

            expect(mockCalculateCashNeededToClose).toHaveBeenCalledWith(
                dto.closingCostFees,
                dto.downPayment,
            );
            expect(result).toEqual(expected);
        });

        it('should work when closingCostFees and downPayment are undefined', async () => {
            const expected = { cashNeeded: 0 };
            mockCalculateCashNeededToClose.mockReturnValue(expected);

            const result = await controller.cashToClose(aDetailsDto);

            expect(mockCalculateCashNeededToClose).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual(expected);
        });

        it('should propagate errors from the service', async () => {
            mockCalculateCashNeededToClose.mockImplementation(() => {
                throw new Error('Calculation failed');
            });

            await expect(controller.cashToClose(aDetailsDto)).rejects.toThrow('Calculation failed');
        });
    });
});
