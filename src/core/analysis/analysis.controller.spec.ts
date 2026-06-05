import { Test, TestingModule } from '@nestjs/testing';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './services';
import { CurrentUserInterface } from '../../interface';
import { AnalysisCreateDto } from './dto/analysis-create.dto';
import { FieldDto, PaginationDto } from '../../common/dto';
import { UsagePeriod } from '../../common/enum';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard, PermissionsGuard } from '../../common/guard';
import { ErrorHandlerService } from '../../common/response';
import { EnvConfigService } from '../../utils/services/config';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('AnalysisController', () => {
    let controller: AnalysisController;
    let analysisService: jest.Mocked<AnalysisService>;

    const mockErrorHandlerService = {
        forbidden: jest.fn((_message, userMessage) => {
            throw new Error(userMessage);
        }),
    };

    const mockEnvConfigService = {
        sAdminRole: 'superadmin',
        adminRole: 'admin',
        userRole: 'user',
        supportRole: 'support',
    };

    const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';
    const VALID_UUID_2 = '456e7890-e89b-12d3-a456-426614174001';

    const mockCurrentUser: CurrentUserInterface = {
        id: 'user-123',
        role: 'user',
        sessionId: 'session-123',
        permissions: { analysis: ['view', 'update', 'delete'] },
    };

    const mockAnalysisService = {
        getUserModuleAnalyses: jest.fn(),
        analysisDetails: jest.fn(),
        createAnalysis: jest.fn(),
        updateAnalysis: jest.fn(),
        saveUsage: jest.fn(),
        getTotalUsageStats: jest.fn(),
        getUsageRepartition: jest.fn(),
    };

    const makePagination = (page = 1, limit = 10): PaginationDto => {
        const p = new PaginationDto();
        jest.spyOn(p, 'getPage').mockReturnValue(page);
        jest.spyOn(p, 'getLimit').mockReturnValue(limit);
        return p;
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            controllers: [AnalysisController],
            providers: [
                { provide: AnalysisService, useValue: mockAnalysisService },
                { provide: Reflector, useValue: { get: jest.fn() } },
                { provide: JwtAuthGuard, useValue: { canActivate: jest.fn(() => true) } },
                { provide: PermissionsGuard, useValue: { canActivate: jest.fn(() => true) } },
                {
                    provide: ErrorHandlerService,
                    useValue: mockErrorHandlerService,
                },
                {
                    provide: EnvConfigService,
                    useValue: mockEnvConfigService,
                },
            ],
        }).compile();

        controller = module.get<AnalysisController>(AnalysisController);
        analysisService = module.get(AnalysisService) as jest.Mocked<AnalysisService>;
    });

    describe('getAnalysisByModule', () => {
        it('should call getUserModuleAnalyses with correct args and return result', async () => {
            const mockResult = { items: [], total: 0 };
            analysisService.getUserModuleAnalyses.mockResolvedValue(mockResult as any);
            const pagination = makePagination(2, 20);

            const result = await controller.getAnalysisByModule(
                mockCurrentUser,
                VALID_UUID,
                pagination,
                'term',
            );

            expect(analysisService.getUserModuleAnalyses).toHaveBeenCalledWith(
                'user-123',
                VALID_UUID,
                2,
                20,
                'term',
            );
            expect(result).toBe(mockResult);
        });

        it('should call getUserModuleAnalyses without search term when omitted', async () => {
            analysisService.getUserModuleAnalyses.mockResolvedValue({ items: [], total: 0 } as any);
            const pagination = makePagination();

            await controller.getAnalysisByModule(mockCurrentUser, VALID_UUID, pagination);

            expect(analysisService.getUserModuleAnalyses).toHaveBeenCalledWith(
                'user-123',
                VALID_UUID,
                1,
                10,
                undefined,
            );
        });

        it('should use page and limit from PaginationDto', async () => {
            analysisService.getUserModuleAnalyses.mockResolvedValue([] as any);
            const pagination = makePagination(3, 5);

            await controller.getAnalysisByModule(mockCurrentUser, VALID_UUID_2, pagination);

            expect(analysisService.getUserModuleAnalyses).toHaveBeenCalledWith(
                'user-123',
                VALID_UUID_2,
                3,
                5,
                undefined,
            );
        });

        it('should forward the user id, not the full user object', async () => {
            analysisService.getUserModuleAnalyses.mockResolvedValue([] as any);
            const pagination = makePagination();

            await controller.getAnalysisByModule(mockCurrentUser, VALID_UUID, pagination);

            const [userId] = analysisService.getUserModuleAnalyses.mock.calls[0];
            expect(userId).toBe('user-123');
        });
    });

    describe('analysisDetails', () => {
        it('should return analysis details for the given user and id', async () => {
            const mockDetail = { id: VALID_UUID, description: 'Test', createdAt: new Date() };
            analysisService.analysisDetails.mockResolvedValue(mockDetail as any);

            const result = await controller.analysisDetails(mockCurrentUser, VALID_UUID);

            expect(analysisService.analysisDetails).toHaveBeenCalledWith(
                mockCurrentUser,
                VALID_UUID,
            );
            expect(result).toBe(mockDetail);
        });

        it('should forward the full user object to the service', async () => {
            analysisService.analysisDetails.mockResolvedValue({} as any);

            await controller.analysisDetails(mockCurrentUser, VALID_UUID_2);

            expect(analysisService.analysisDetails).toHaveBeenCalledWith(
                mockCurrentUser,
                VALID_UUID_2,
            );
        });
    });

    describe('createAnalysis', () => {
        const dto: AnalysisCreateDto = {
            moduleId: VALID_UUID,
            propertyId: VALID_UUID_2,
            description: 'New analysis',
        };

        it('should create an analysis and return success message', async () => {
            const mockResult = { message: 'Analysis created successfully.' };
            analysisService.createAnalysis.mockResolvedValue(mockResult as any);

            const result = await controller.createAnalysis(mockCurrentUser, dto);

            expect(analysisService.createAnalysis).toHaveBeenCalledWith(mockCurrentUser, dto);
            expect(result).toBe(mockResult);
        });

        it('should create an analysis without description', async () => {
            const dtoWithoutDesc: AnalysisCreateDto = {
                moduleId: VALID_UUID,
                propertyId: VALID_UUID_2,
            };
            analysisService.createAnalysis.mockResolvedValue({ message: 'ok' } as any);

            await controller.createAnalysis(mockCurrentUser, dtoWithoutDesc);

            expect(analysisService.createAnalysis).toHaveBeenCalledWith(
                mockCurrentUser,
                dtoWithoutDesc,
            );
        });

        it('should forward the full user object to the service', async () => {
            analysisService.createAnalysis.mockResolvedValue({ message: 'ok' } as any);

            await controller.createAnalysis(mockCurrentUser, dto);

            const [calledUser] = analysisService.createAnalysis.mock.calls[0];
            expect(calledUser).toBe(mockCurrentUser);
        });
    });

    describe('updateAnalysis', () => {
        it('should update analysis with a description field', async () => {
            const dto: FieldDto = { field: 'Updated description' };
            const mockResult = { message: 'Analysis updated successfully.' };
            analysisService.updateAnalysis.mockResolvedValue(mockResult as any);

            const result = await controller.updateAnalysis(mockCurrentUser, VALID_UUID, dto);

            expect(analysisService.updateAnalysis).toHaveBeenCalledWith(
                mockCurrentUser,
                VALID_UUID,
                'Updated description',
            );
            expect(result).toBe(mockResult);
        });

        it('should pass undefined when dto.field is undefined', async () => {
            const dto: FieldDto = { field: undefined! };
            analysisService.updateAnalysis.mockResolvedValue({ message: 'ok' } as any);

            await controller.updateAnalysis(mockCurrentUser, VALID_UUID, dto);

            expect(analysisService.updateAnalysis).toHaveBeenCalledWith(
                mockCurrentUser,
                VALID_UUID,
                undefined,
            );
        });

        it('should forward user object and id to the service', async () => {
            const dto: FieldDto = { field: 'desc' };
            analysisService.updateAnalysis.mockResolvedValue({ message: 'ok' } as any);

            await controller.updateAnalysis(mockCurrentUser, VALID_UUID_2, dto);

            expect(analysisService.updateAnalysis).toHaveBeenCalledWith(
                mockCurrentUser,
                VALID_UUID_2,
                'desc',
            );
        });
    });

    describe('saveAnalysisUsage', () => {
        it('should save analysis usage and return success message', async () => {
            const mockResult = { message: 'Analysis usage saved successfully.' };
            analysisService.saveUsage.mockResolvedValue(mockResult as any);

            const result = await controller.saveAnalysisUsage(VALID_UUID);

            expect(analysisService.saveUsage).toHaveBeenCalledWith(VALID_UUID);
            expect(result).toBe(mockResult);
        });

        it('should forward the correct id to saveUsage', async () => {
            analysisService.saveUsage.mockResolvedValue({ message: 'ok' } as any);

            await controller.saveAnalysisUsage(VALID_UUID_2);

            expect(analysisService.saveUsage).toHaveBeenCalledWith(VALID_UUID_2);
        });
    });

    describe('totalUsageStats', () => {
        it.each([
            [UsagePeriod.ONE_DAY],
            [UsagePeriod.ONE_WEEK],
            [UsagePeriod.ONE_MONTH],
            [UsagePeriod.ONE_YEAR],
        ])('should return stats for period %s', async (period) => {
            const mockStats = { total: 10, previous: 5, evolution: 100, period, chart: [] };
            analysisService.getTotalUsageStats.mockResolvedValue(mockStats as any);

            const result = await controller.totalUsageStats(period);

            expect(analysisService.getTotalUsageStats).toHaveBeenCalledWith(period);
            expect(result).toBe(mockStats);
        });

        it('should call getTotalUsageStats exactly once per request', async () => {
            analysisService.getTotalUsageStats.mockResolvedValue({} as any);

            await controller.totalUsageStats(UsagePeriod.ONE_MONTH);

            expect(analysisService.getTotalUsageStats).toHaveBeenCalledTimes(1);
        });
    });

    describe('usageRepartition', () => {
        it.each([
            [UsagePeriod.ONE_DAY],
            [UsagePeriod.ONE_WEEK],
            [UsagePeriod.ONE_MONTH],
            [UsagePeriod.ONE_YEAR],
        ])('should return repartition for period %s', async (period) => {
            const mockRepartition = [{ moduleId: 'm1', usages: 5 }];
            analysisService.getUsageRepartition.mockResolvedValue(mockRepartition as any);

            const result = await controller.usageRepartition(period);

            expect(analysisService.getUsageRepartition).toHaveBeenCalledWith(period);
            expect(result).toBe(mockRepartition);
        });

        it('should call getUsageRepartition exactly once per request', async () => {
            analysisService.getUsageRepartition.mockResolvedValue([]);

            await controller.usageRepartition(UsagePeriod.ONE_YEAR);

            expect(analysisService.getUsageRepartition).toHaveBeenCalledTimes(1);
        });
    });
});
