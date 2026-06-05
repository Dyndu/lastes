import { Test, TestingModule } from '@nestjs/testing';
import { CFinancingController } from './c-financing.controller';
import { CFinancingService } from './services';
import { CurrentUserInterface } from '../../interface';
import { EnvConfigService } from '../../utils/services/config';
import { ErrorHandlerService } from '../../common/response';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard, PermissionsGuard } from '../../common/guard';
import { CreatePDetailsDto, ADetailsDto, CreateRepairsDto, FExpenseDto } from '../a-builder/dto';
import { PropertyDetailsTypeEnum, AcquisitionMethodEnum } from '../../common/enum';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

const mockCFinancingService = {
    getCFinancingAnalysisBuilder: jest.fn(),
    getCFinancingPropertyDetails: jest.fn(),
    getCFinancingAcquisitionDetails: jest.fn(),
    getCFinancingRepairs: jest.fn(),
    getCFinancingFExpense: jest.fn(),
    resolveCFinancingPD: jest.fn(),
    resolveCFinancingAD: jest.fn(),
    resolveCFinancingRepairs: jest.fn(),
    resolveCFinancingFExpenses: jest.fn(),
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

describe('CFinancingController', () => {
    let controller: CFinancingController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [CFinancingController],
            providers: [
                { provide: CFinancingService, useValue: mockCFinancingService },
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

        controller = module.get<CFinancingController>(CFinancingController);
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getCFinancingAnalysisBuilder', () => {
        it('should call cFinancingService.getCFinancingAnalysisBuilder with user and id and return result', async () => {
            const expected = { idAnalysis: mockUUID, propertyDetails: null };
            mockCFinancingService.getCFinancingAnalysisBuilder.mockResolvedValue(expected);

            const result = await controller.getCFinancingAnalysisBuilder(mockUser, mockUUID);

            expect(mockCFinancingService.getCFinancingAnalysisBuilder).toHaveBeenCalledWith(
                mockUser,
                mockUUID,
            );
            expect(result).toEqual(expected);
        });

        it('should propagate errors from the service', async () => {
            mockCFinancingService.getCFinancingAnalysisBuilder.mockRejectedValue(
                new Error('Analysis not found'),
            );

            await expect(
                controller.getCFinancingAnalysisBuilder(mockUser, mockUUID),
            ).rejects.toThrow('Analysis not found');
        });
    });

    describe('getCFinancingPropertyDetails', () => {
        it('should call cFinancingService.getCFinancingPropertyDetails with user and id and return result', async () => {
            const expected = { idAnalysis: mockUUID, propertyDetails: {} };
            mockCFinancingService.getCFinancingPropertyDetails.mockResolvedValue(expected);

            const result = await controller.getCFinancingPropertyDetails(mockUser, mockUUID);

            expect(mockCFinancingService.getCFinancingPropertyDetails).toHaveBeenCalledWith(
                mockUser,
                mockUUID,
            );
            expect(result).toEqual(expected);
        });

        it('should propagate errors from the service', async () => {
            mockCFinancingService.getCFinancingPropertyDetails.mockRejectedValue(
                new Error('Not found'),
            );

            await expect(
                controller.getCFinancingPropertyDetails(mockUser, mockUUID),
            ).rejects.toThrow('Not found');
        });
    });

    describe('getCFinancingAcquisitionDetails', () => {
        it('should call cFinancingService.getCFinancingAcquisitionDetails with user and id and return result', async () => {
            const expected = { idAnalysis: mockUUID, acquisitionDetails: {} };
            mockCFinancingService.getCFinancingAcquisitionDetails.mockResolvedValue(expected);

            const result = await controller.getCFinancingAcquisitionDetails(mockUser, mockUUID);

            expect(mockCFinancingService.getCFinancingAcquisitionDetails).toHaveBeenCalledWith(
                mockUser,
                mockUUID,
            );
            expect(result).toEqual(expected);
        });

        it('should propagate errors from the service', async () => {
            mockCFinancingService.getCFinancingAcquisitionDetails.mockRejectedValue(
                new Error('Not found'),
            );

            await expect(
                controller.getCFinancingAcquisitionDetails(mockUser, mockUUID),
            ).rejects.toThrow('Not found');
        });
    });

    describe('getCFinancingRepairs', () => {
        it('should call cFinancingService.getCFinancingRepairs with user and id and return result', async () => {
            const expected = { idAnalysis: mockUUID, repairs: {} };
            mockCFinancingService.getCFinancingRepairs.mockResolvedValue(expected);

            const result = await controller.getCFinancingRepairs(mockUser, mockUUID);

            expect(mockCFinancingService.getCFinancingRepairs).toHaveBeenCalledWith(
                mockUser,
                mockUUID,
            );
            expect(result).toEqual(expected);
        });

        it('should propagate errors from the service', async () => {
            mockCFinancingService.getCFinancingRepairs.mockRejectedValue(new Error('Not found'));

            await expect(controller.getCFinancingRepairs(mockUser, mockUUID)).rejects.toThrow(
                'Not found',
            );
        });
    });

    describe('getCFinancingFExpenses', () => {
        it('should call cFinancingService.getCFinancingFExpense with user and id and return result', async () => {
            const expected = { idAnalysis: mockUUID, fExpenses: {} };
            mockCFinancingService.getCFinancingFExpense.mockResolvedValue(expected);

            const result = await controller.getCFinancingFExpenses(mockUser, mockUUID);

            expect(mockCFinancingService.getCFinancingFExpense).toHaveBeenCalledWith(
                mockUser,
                mockUUID,
            );
            expect(result).toEqual(expected);
        });

        it('should propagate errors from the service', async () => {
            mockCFinancingService.getCFinancingFExpense.mockRejectedValue(new Error('Not found'));

            await expect(controller.getCFinancingFExpenses(mockUser, mockUUID)).rejects.toThrow(
                'Not found',
            );
        });
    });

    describe('resolvePropertyDetails', () => {
        it('should call cFinancingService.resolveCFinancingPD with user, id and dto and return result', async () => {
            const expected = { idAnalysis: mockUUID, propertyDetails: {} };
            mockCFinancingService.resolveCFinancingPD.mockResolvedValue(expected);

            const result = await controller.resolvePropertyDetails(
                mockUser,
                mockUUID,
                createPDetailsDto,
            );

            expect(mockCFinancingService.resolveCFinancingPD).toHaveBeenCalledWith(
                mockUser,
                mockUUID,
                createPDetailsDto,
            );
            expect(result).toEqual(expected);
        });

        it('should work with MULTI_FAMILY type', async () => {
            const multiDto = { ...createPDetailsDto, status: PropertyDetailsTypeEnum.MULTI_FAMILY };
            mockCFinancingService.resolveCFinancingPD.mockResolvedValue({ idAnalysis: mockUUID });

            await controller.resolvePropertyDetails(mockUser, mockUUID, multiDto);

            expect(mockCFinancingService.resolveCFinancingPD).toHaveBeenCalledWith(
                mockUser,
                mockUUID,
                multiDto,
            );
        });

        it('should propagate errors from the service', async () => {
            mockCFinancingService.resolveCFinancingPD.mockRejectedValue(
                new Error('Analysis not found'),
            );

            await expect(
                controller.resolvePropertyDetails(mockUser, mockUUID, createPDetailsDto),
            ).rejects.toThrow('Analysis not found');
        });
    });

    describe('resolveAcquisitionDetails', () => {
        it('should call cFinancingService.resolveCFinancingAD with user, id and dto and return result', async () => {
            const expected = { idAnalysis: mockUUID, acquisitionDetails: {} };
            mockCFinancingService.resolveCFinancingAD.mockResolvedValue(expected);

            const result = await controller.resolveAcquisitionDetails(
                mockUser,
                mockUUID,
                aDetailsDto,
            );

            expect(mockCFinancingService.resolveCFinancingAD).toHaveBeenCalledWith(
                mockUser,
                mockUUID,
                aDetailsDto,
            );
            expect(result).toEqual(expected);
        });

        it('should work with FINANCED method', async () => {
            const financedDto = {
                ...aDetailsDto,
                method: AcquisitionMethodEnum.FINANCED,
                downPayment: 50000,
            };
            mockCFinancingService.resolveCFinancingAD.mockResolvedValue({ idAnalysis: mockUUID });

            await controller.resolveAcquisitionDetails(mockUser, mockUUID, financedDto);

            expect(mockCFinancingService.resolveCFinancingAD).toHaveBeenCalledWith(
                mockUser,
                mockUUID,
                financedDto,
            );
        });

        it('should propagate errors from the service', async () => {
            mockCFinancingService.resolveCFinancingAD.mockRejectedValue(
                new Error('Analysis not found'),
            );

            await expect(
                controller.resolveAcquisitionDetails(mockUser, mockUUID, aDetailsDto),
            ).rejects.toThrow('Analysis not found');
        });
    });

    describe('resolveRepairs', () => {
        it('should call cFinancingService.resolveCFinancingRepairs with user, id and dto and return result', async () => {
            const expected = { idAnalysis: mockUUID, repairs: {} };
            mockCFinancingService.resolveCFinancingRepairs.mockResolvedValue(expected);

            const result = await controller.resolveRepairs(mockUser, mockUUID, createRepairsDto);

            expect(mockCFinancingService.resolveCFinancingRepairs).toHaveBeenCalledWith(
                mockUser,
                mockUUID,
                createRepairsDto,
            );
            expect(result).toEqual(expected);
        });

        it('should work with minimal repairs dto', async () => {
            const minimalDto: CreateRepairsDto = { total: 0 };
            mockCFinancingService.resolveCFinancingRepairs.mockResolvedValue({
                idAnalysis: mockUUID,
            });

            await controller.resolveRepairs(mockUser, mockUUID, minimalDto);

            expect(mockCFinancingService.resolveCFinancingRepairs).toHaveBeenCalledWith(
                mockUser,
                mockUUID,
                minimalDto,
            );
        });

        it('should propagate errors from the service', async () => {
            mockCFinancingService.resolveCFinancingRepairs.mockRejectedValue(
                new Error('Analysis not found'),
            );

            await expect(
                controller.resolveRepairs(mockUser, mockUUID, createRepairsDto),
            ).rejects.toThrow('Analysis not found');
        });
    });

    describe('resolveFExpenses', () => {
        it('should call cFinancingService.resolveCFinancingFExpenses with user, id and dto and return result', async () => {
            const expected = { idAnalysis: mockUUID, fExpenses: {} };
            mockCFinancingService.resolveCFinancingFExpenses.mockResolvedValue(expected);

            const result = await controller.resolveFExpenses(mockUser, mockUUID, fExpenseDto);

            expect(mockCFinancingService.resolveCFinancingFExpenses).toHaveBeenCalledWith(
                mockUser,
                mockUUID,
                fExpenseDto,
            );
            expect(result).toEqual(expected);
        });

        it('should work with zeroed expenses dto', async () => {
            const zeroDto: FExpenseDto = {
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
            mockCFinancingService.resolveCFinancingFExpenses.mockResolvedValue({
                idAnalysis: mockUUID,
            });

            await controller.resolveFExpenses(mockUser, mockUUID, zeroDto);

            expect(mockCFinancingService.resolveCFinancingFExpenses).toHaveBeenCalledWith(
                mockUser,
                mockUUID,
                zeroDto,
            );
        });

        it('should propagate errors from the service', async () => {
            mockCFinancingService.resolveCFinancingFExpenses.mockRejectedValue(
                new Error('Analysis not found'),
            );

            await expect(
                controller.resolveFExpenses(mockUser, mockUUID, fExpenseDto),
            ).rejects.toThrow('Analysis not found');
        });
    });
});
