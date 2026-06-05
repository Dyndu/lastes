import { Test, TestingModule } from '@nestjs/testing';
import { RCalculatorController } from './r-calculator.controller';
import { RCalculatorService } from './services';
import { BAnalysisTypeEnum } from '../../common/enum';
import { CalculationMethodEnum } from '../../common/enum';
import { AddSectionsToRoomDto } from './dto/add-sections-to-room.dto';
import { ResolveREItemDto, UpdateREItemDto } from '../b-analysis/dto';
import { CurrentUserInterface } from '../../interface';
import { EnvConfigService } from '../../utils/services/config';
import { ErrorHandlerService } from '../../common/response';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard, PermissionsGuard } from '../../common/guard';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

const mockPreRCalculatorService = {
    computeREItemRowTotal: jest.fn(),
    computeRSectionTotal: jest.fn(),
};

const mockRCalculatorService = {
    getRCalculatorDetails: jest.fn(),
    updateRCalculatorDetails: jest.fn(),
    preRCalculatorService: mockPreRCalculatorService,
    getRoomTotal: jest.fn(),
    getSectionTotal: jest.fn(),
    getExpenseRowTotal: jest.fn(),
    resolveBuilderForAnalysis: jest.fn(),
    getRoomsByType: jest.fn(),
    getRoomSections: jest.fn(),
    getSectionRecords: jest.fn(),
    addRoomByType: jest.fn(),
    addSectionRoom: jest.fn(),
    addRecordToSection: jest.fn(),
    getRCSummary: jest.fn(),
    getRCPunchList: jest.fn(),
};

const mockUser: CurrentUserInterface = {
    id: 'user-uuid-1234',
    role: 'user',
    sessionId: 'session-uuid-5678',
    permissions: { rehab: ['read', 'write'] },
};

const mockUUID = '2908dec0-a048-4a29-9810-e730e48a057b';

const updateREItemDto: UpdateREItemDto = {
    id: mockUUID,
    label: 'Roof Maintenance',
    cMethod: CalculationMethodEnum.LABOR_MATERIAL,
    laborValue: 100,
    materialValue: 200,
    total: 300,
};

const resolveREItemDto: ResolveREItemDto = {
    items: [updateREItemDto],
};

const addSectionsDto: AddSectionsToRoomDto = {
    labels: ['Roof', 'Kitchen', 'Toilets'],
};

describe('RCalculatorController', () => {
    let controller: RCalculatorController;

    const mockEnvConfigService = {
        sAdminRole: 'superadmin',
        adminRole: 'admin',
        userRole: 'user',
        supportRole: 'support',
    };

    const mockErrorHandlerService = {
        forbidden: jest.fn((_message, userMessage) => {
            throw new Error(userMessage);
        }),
    };

    const mockReflector = {
        get: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [RCalculatorController],
            providers: [
                {
                    provide: RCalculatorService,
                    useValue: mockRCalculatorService,
                },
                {
                    provide: EnvConfigService,
                    useValue: mockEnvConfigService,
                },
                {
                    provide: ErrorHandlerService,
                    useValue: mockErrorHandlerService,
                },
                {
                    provide: Reflector,
                    useValue: mockReflector,
                },
                {
                    provide: JwtAuthGuard,
                    useValue: { canActivate: jest.fn(() => true) },
                },
                {
                    provide: PermissionsGuard,
                    useValue: { canActivate: jest.fn(() => true) },
                },
            ],
        }).compile();

        controller = module.get<RCalculatorController>(RCalculatorController);

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('computeREItemTotal', () => {
        it('should call rCService.getExpenseRowTotal with id and return result', async () => {
            const expected = { total: 300 };
            mockRCalculatorService.getExpenseRowTotal = jest.fn().mockResolvedValue(expected);

            const result = await controller.computeREItemTotal(mockUUID);

            expect(mockRCalculatorService.getExpenseRowTotal).toHaveBeenCalledWith(mockUUID);
            expect(result).toEqual(expected);
        });

        it('should propagate errors from the service', async () => {
            mockRCalculatorService.getExpenseRowTotal = jest
                .fn()
                .mockRejectedValue(new Error('Service error'));

            await expect(controller.computeREItemTotal(mockUUID)).rejects.toThrow('Service error');
        });
    });

    describe('computeRSectionTotal', () => {
        it('should call rCService.getSectionTotal with id and return result', async () => {
            const expected = { sectionTotal: 600 };
            mockRCalculatorService.getSectionTotal = jest.fn().mockResolvedValue(expected);

            const result = await controller.computeRSectionTotal(mockUUID);

            expect(mockRCalculatorService.getSectionTotal).toHaveBeenCalledWith(mockUUID);
            expect(result).toEqual(expected);
        });

        it('should propagate errors from the service', async () => {
            mockRCalculatorService.getSectionTotal = jest
                .fn()
                .mockRejectedValue(new Error('Section error'));

            await expect(controller.computeRSectionTotal(mockUUID)).rejects.toThrow(
                'Section error',
            );
        });
    });

    describe('getRoomTotal', () => {
        it('should call rCService.getRoomTotal with id and return result', async () => {
            const expected = { roomTotal: 1500 };
            mockRCalculatorService.getRoomTotal.mockResolvedValue(expected);

            const result = await controller.getRoomTotal(mockUUID);

            expect(mockRCalculatorService.getRoomTotal).toHaveBeenCalledWith(mockUUID);
            expect(result).toEqual(expected);
        });

        it('should propagate errors from the service', async () => {
            mockRCalculatorService.getRoomTotal.mockRejectedValue(new Error('Room not found'));

            await expect(controller.getRoomTotal(mockUUID)).rejects.toThrow('Room not found');
        });
    });

    describe('getRCAnalysisBuilder', () => {
        it('should call rCService.resolveBuilderForAnalysis with user, id and type', async () => {
            const expected = { builder: { id: mockUUID, rooms: [] } };
            mockRCalculatorService.resolveBuilderForAnalysis.mockResolvedValue(expected);

            const result = await controller.getRCAnalysisBuilder(
                mockUser,
                mockUUID,
                BAnalysisTypeEnum.INTERIOR_EXPENSES,
            );

            expect(mockRCalculatorService.resolveBuilderForAnalysis).toHaveBeenCalledWith(
                mockUser,
                mockUUID,
                BAnalysisTypeEnum.INTERIOR_EXPENSES,
            );
            expect(result).toEqual(expected);
        });

        it('should work with EXTERIOR_EXPENSES type', async () => {
            const expected = { builder: { id: mockUUID, rooms: [] } };
            mockRCalculatorService.resolveBuilderForAnalysis.mockResolvedValue(expected);

            await controller.getRCAnalysisBuilder(
                mockUser,
                mockUUID,
                BAnalysisTypeEnum.EXTERIOR_EXPENSES,
            );

            expect(mockRCalculatorService.resolveBuilderForAnalysis).toHaveBeenCalledWith(
                mockUser,
                mockUUID,
                BAnalysisTypeEnum.EXTERIOR_EXPENSES,
            );
        });

        it('should propagate errors from the service', async () => {
            mockRCalculatorService.resolveBuilderForAnalysis.mockRejectedValue(
                new Error('Analysis not found'),
            );

            await expect(
                controller.getRCAnalysisBuilder(
                    mockUser,
                    mockUUID,
                    BAnalysisTypeEnum.INTERIOR_EXPENSES,
                ),
            ).rejects.toThrow('Analysis not found');
        });
    });

    describe('getABuilderRooms', () => {
        it('should call rCService.getRoomsByType with user, id and type', async () => {
            const expected = [{ id: mockUUID, name: 'Living Room' }];
            mockRCalculatorService.getRoomsByType.mockResolvedValue(expected);

            const result = await controller.getABuilderRooms(
                mockUser,
                mockUUID,
                BAnalysisTypeEnum.INTERIOR_EXPENSES,
            );

            expect(mockRCalculatorService.getRoomsByType).toHaveBeenCalledWith(
                mockUser,
                mockUUID,
                BAnalysisTypeEnum.INTERIOR_EXPENSES,
            );
            expect(result).toEqual(expected);
        });

        it('should work with EXTERIOR_EXPENSES type', async () => {
            mockRCalculatorService.getRoomsByType.mockResolvedValue([]);

            await controller.getABuilderRooms(
                mockUser,
                mockUUID,
                BAnalysisTypeEnum.EXTERIOR_EXPENSES,
            );

            expect(mockRCalculatorService.getRoomsByType).toHaveBeenCalledWith(
                mockUser,
                mockUUID,
                BAnalysisTypeEnum.EXTERIOR_EXPENSES,
            );
        });

        it('should propagate errors from the service', async () => {
            mockRCalculatorService.getRoomsByType.mockRejectedValue(new Error('Not found'));

            await expect(
                controller.getABuilderRooms(
                    mockUser,
                    mockUUID,
                    BAnalysisTypeEnum.INTERIOR_EXPENSES,
                ),
            ).rejects.toThrow('Not found');
        });
    });

    describe('getSectionsOfRooms', () => {
        it('should call rCService.getRoomSections with id and return result', async () => {
            const expected = [{ id: mockUUID, label: 'Roof' }];
            mockRCalculatorService.getRoomSections.mockResolvedValue(expected);

            const result = await controller.getSectionsOfRooms(mockUUID);

            expect(mockRCalculatorService.getRoomSections).toHaveBeenCalledWith(mockUUID);
            expect(result).toEqual(expected);
        });

        it('should return empty array when no sections', async () => {
            mockRCalculatorService.getRoomSections.mockResolvedValue([]);

            const result = await controller.getSectionsOfRooms(mockUUID);

            expect(result).toEqual([]);
        });

        it('should propagate errors from the service', async () => {
            mockRCalculatorService.getRoomSections.mockRejectedValue(new Error('Room not found'));

            await expect(controller.getSectionsOfRooms(mockUUID)).rejects.toThrow('Room not found');
        });
    });

    describe('getSectionRecords', () => {
        it('should call rCService.getSectionRecords with id and return result', async () => {
            const expected = [{ id: mockUUID, label: 'Roof Maintenance', total: 300 }];
            mockRCalculatorService.getSectionRecords.mockResolvedValue(expected);

            const result = await controller.getSectionRecords(mockUUID);

            expect(mockRCalculatorService.getSectionRecords).toHaveBeenCalledWith(mockUUID);
            expect(result).toEqual(expected);
        });

        it('should return empty array when no records', async () => {
            mockRCalculatorService.getSectionRecords.mockResolvedValue([]);

            const result = await controller.getSectionRecords(mockUUID);

            expect(result).toEqual([]);
        });

        it('should propagate errors from the service', async () => {
            mockRCalculatorService.getSectionRecords.mockRejectedValue(
                new Error('Section not found'),
            );

            await expect(controller.getSectionRecords(mockUUID)).rejects.toThrow(
                'Section not found',
            );
        });
    });

    describe('addRoomToABuilder', () => {
        it('should call rCService.addRoomByType with user, id and type', async () => {
            const expected = { id: mockUUID, name: 'New Room' };
            mockRCalculatorService.addRoomByType.mockResolvedValue(expected);

            const result = await controller.addRoomToABuilder(
                mockUser,
                mockUUID,
                BAnalysisTypeEnum.INTERIOR_EXPENSES,
            );

            expect(mockRCalculatorService.addRoomByType).toHaveBeenCalledWith(
                mockUser,
                mockUUID,
                BAnalysisTypeEnum.INTERIOR_EXPENSES,
            );
            expect(result).toEqual(expected);
        });

        it('should work with EXTERIOR_EXPENSES type', async () => {
            const expected = { id: mockUUID, name: 'Exterior Room' };
            mockRCalculatorService.addRoomByType.mockResolvedValue(expected);

            await controller.addRoomToABuilder(
                mockUser,
                mockUUID,
                BAnalysisTypeEnum.EXTERIOR_EXPENSES,
            );

            expect(mockRCalculatorService.addRoomByType).toHaveBeenCalledWith(
                mockUser,
                mockUUID,
                BAnalysisTypeEnum.EXTERIOR_EXPENSES,
            );
        });

        it('should propagate errors from the service', async () => {
            mockRCalculatorService.addRoomByType.mockRejectedValue(new Error('Analysis not found'));

            await expect(
                controller.addRoomToABuilder(
                    mockUser,
                    mockUUID,
                    BAnalysisTypeEnum.INTERIOR_EXPENSES,
                ),
            ).rejects.toThrow('Analysis not found');
        });
    });

    describe('addSectionsToRoom', () => {
        it('should call rCService.addSectionRoom with id and labels', async () => {
            const expected = [
                { id: '1', label: 'Roof' },
                { id: '2', label: 'Kitchen' },
                { id: '3', label: 'Toilets' },
            ];
            mockRCalculatorService.addSectionRoom.mockResolvedValue(expected);

            const result = await controller.addSectionsToRoom(mockUUID, addSectionsDto);

            expect(mockRCalculatorService.addSectionRoom).toHaveBeenCalledWith(
                mockUUID,
                addSectionsDto.labels,
            );
            expect(result).toEqual(expected);
        });

        it('should handle a single label', async () => {
            const singleLabelDto: AddSectionsToRoomDto = { labels: ['Garage'] };
            mockRCalculatorService.addSectionRoom.mockResolvedValue([{ id: '1', label: 'Garage' }]);

            await controller.addSectionsToRoom(mockUUID, singleLabelDto);

            expect(mockRCalculatorService.addSectionRoom).toHaveBeenCalledWith(mockUUID, [
                'Garage',
            ]);
        });

        it('should propagate errors from the service', async () => {
            mockRCalculatorService.addSectionRoom.mockRejectedValue(new Error('Room not found'));

            await expect(controller.addSectionsToRoom(mockUUID, addSectionsDto)).rejects.toThrow(
                'Room not found',
            );
        });
    });

    describe('resolveSectionRecords', () => {
        it('should call rCService.addRecordToSection with id and dto', async () => {
            const expected = { upserted: 1, items: [updateREItemDto] };
            mockRCalculatorService.addRecordToSection.mockResolvedValue(expected);

            const result = await controller.resolveSectionRecords(mockUUID, resolveREItemDto);

            expect(mockRCalculatorService.addRecordToSection).toHaveBeenCalledWith(
                mockUUID,
                resolveREItemDto,
            );
            expect(result).toEqual(expected);
        });

        it('should handle multiple items in dto', async () => {
            const multiItemDto: ResolveREItemDto = {
                items: [
                    updateREItemDto,
                    {
                        label: 'Window Repair',
                        cMethod: CalculationMethodEnum.TOTAL_UNIT,
                        laborValue: 50,
                        materialValue: 80,
                    },
                ],
            };
            mockRCalculatorService.addRecordToSection.mockResolvedValue({ upserted: 2 });

            await controller.resolveSectionRecords(mockUUID, multiItemDto);

            expect(mockRCalculatorService.addRecordToSection).toHaveBeenCalledWith(
                mockUUID,
                multiItemDto,
            );
        });

        it('should propagate errors from the service', async () => {
            mockRCalculatorService.addRecordToSection.mockRejectedValue(
                new Error('Section not found'),
            );

            await expect(
                controller.resolveSectionRecords(mockUUID, resolveREItemDto),
            ).rejects.toThrow('Section not found');
        });
    });

    describe('getRCSummary', () => {
        it('should call rCService.getRCSummary with user and id and return result', async () => {
            const expected = { totalProjectCost: 15000, categories: [] };
            mockRCalculatorService.getRCSummary.mockResolvedValue(expected);

            const result = await controller.getRCSummary(mockUser, mockUUID);

            expect(mockRCalculatorService.getRCSummary).toHaveBeenCalledWith(mockUser, mockUUID);
            expect(result).toEqual(expected);
        });

        it('should propagate errors from the service', async () => {
            mockRCalculatorService.getRCSummary.mockRejectedValue(new Error('Analysis not found'));

            await expect(controller.getRCSummary(mockUser, mockUUID)).rejects.toThrow(
                'Analysis not found',
            );
        });
    });

    describe('punchList', () => {
        it('should call rCService.getRCPunchList with user and id and return result', async () => {
            const expected = { totalProjectCost: 10000, rooms: [] };
            mockRCalculatorService.getRCPunchList.mockResolvedValue(expected);

            const result = await controller.punchList(mockUser, mockUUID);

            expect(mockRCalculatorService.getRCPunchList).toHaveBeenCalledWith(mockUser, mockUUID);
            expect(result).toEqual(expected);
        });

        it('should propagate errors from the service', async () => {
            mockRCalculatorService.getRCPunchList.mockRejectedValue(
                new Error('Analysis not found'),
            );

            await expect(controller.punchList(mockUser, mockUUID)).rejects.toThrow(
                'Analysis not found',
            );
        });
    });
});
