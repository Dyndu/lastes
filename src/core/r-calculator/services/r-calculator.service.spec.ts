import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { RCalculatorService } from './r-calculator.service';
import { PreRCalculatorService } from './pre-r-calculator.service';
import { TransformRCalculatorService } from './transform-r-calculator.service';
import { RAnalysisService } from '../../r-analysis/services';
import { BAnalysisService } from '../../b-analysis/services';
import { RCalculatorRepository } from '../r-calculator.repository';
import { ErrorHandlerService } from '../../../common/response';
import { OtherUtils } from '../../../utils/services/tools';
import { BAnalysisTypeEnum, ModuleLabelEnum } from '../../../common/enum';
import { BAnalysisEntity } from '../../b-analysis/entities';
import { ResolveREItemDto } from '../../b-analysis/dto';
import { CurrentUserInterface } from '../../../interface';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
};

const mockRoomCategoryService = {
    retrieveRoomCategoryByCriteria: jest.fn(),
    createRoomCategory: jest.fn(),
};

const mockRoomSectionService = {
    retrieveRoomSectionByCriteria: jest.fn(),
    createManyRSections: jest.fn(),
};

const mockRoomExpenseItemService = {
    resolveREItem: jest.fn(),
    retrieveRExpenseByCriteria: jest.fn(),
};

const mockTransformBAEntitiesService = {
    transformRooms: jest.fn(),
    transformRoomSections: jest.fn(),
    transformRSection: jest.fn(),
};

const mockBAnalysisService = {
    retrieveBAnalysisByCriteria: jest.fn(),
    bAnalysisRepo: {
        findOne: jest.fn(),
    },
    roomCategoryService: mockRoomCategoryService,
    roomSectionService: mockRoomSectionService,
    roomExpenseItemService: mockRoomExpenseItemService,
    transformBAEntitiesService: mockTransformBAEntitiesService,
};

const mockRAnalysisService = {
    getAnalysis: jest.fn(),
};

const mockErrorHandler = {};

const mockOtherUtils = {};

const mockPreRCalculatorService = {
    computeRoomTotal: jest.fn(),
    computeRSectionTotal: jest.fn(),
    computeREItemRowTotal: jest.fn(),
    initializeRCalculatorForAnalysis: jest.fn(),
    rCalculatorSummary: jest.fn(),
    getPunchList: jest.fn(),
};

const mockRCalculatorRepo = {
    update: jest.fn().mockResolvedValue({ affected: 1 }),
};

const mockTransformRCalculatorService = {
    rCalculatorDetails: jest.fn().mockReturnValue(['module', 'createdBy', 'rehabCalculator']),
    transformRCalculatorDetails: jest.fn(),
    roomTotalEntities: jest.fn().mockReturnValue(['rel1']),
    analysisEntities: jest.fn().mockReturnValue(['rel2']),
    rCalculatorABuilderEntities: jest.fn().mockReturnValue(['rel3']),
    rCBuilderRooms: jest.fn().mockReturnValue(['rel4']),
    roomEntities: jest.fn().mockReturnValue(['rel5']),
    sectionExpenses: jest.fn().mockReturnValue(['rel6']),
    transformRCBAnalysis: jest.fn(),
    rCalculatorSummaryEntities: jest.fn().mockReturnValue(['rel2']),
};

const mockUser: CurrentUserInterface = { id: 'user-1' } as CurrentUserInterface;

const mockAnalysis = {
    rehabCalculator: {
        id: 'rc-1',
        analysisBuilder: { id: 'ab-1' },
    },
};

const mockABuilder: Partial<BAnalysisEntity> = {
    id: 'builder-1',
    rooms: [],
};

describe('RCalculatorService', () => {
    let service: RCalculatorService;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RCalculatorService,
                { provide: WINSTON_MODULE_PROVIDER, useValue: mockLogger },
                { provide: PreRCalculatorService, useValue: mockPreRCalculatorService },
                { provide: TransformRCalculatorService, useValue: mockTransformRCalculatorService },
                { provide: RAnalysisService, useValue: mockRAnalysisService },
                { provide: BAnalysisService, useValue: mockBAnalysisService },
                { provide: RCalculatorRepository, useValue: mockRCalculatorRepo },
                { provide: ErrorHandlerService, useValue: mockErrorHandler },
                { provide: OtherUtils, useValue: mockOtherUtils },
            ],
        }).compile();

        service = module.get<RCalculatorService>(RCalculatorService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getRoomTotal', () => {
        it('should retrieve room category and return computed total', async () => {
            const mockRoom = { id: 'room-1' };
            const expectedTotal = 5000;

            mockRoomCategoryService.retrieveRoomCategoryByCriteria.mockResolvedValue(mockRoom);
            mockPreRCalculatorService.computeRoomTotal.mockReturnValue(expectedTotal);

            const result = await service.getRoomTotal('room-1');

            expect(mockTransformRCalculatorService.roomTotalEntities).toHaveBeenCalled();
            expect(mockRoomCategoryService.retrieveRoomCategoryByCriteria).toHaveBeenCalledWith(
                { id: 'room-1' },
                ['rel1'],
            );
            expect(mockPreRCalculatorService.computeRoomTotal).toHaveBeenCalledWith(mockRoom);
            expect(result).toBe(expectedTotal);
        });
    });

    describe('getSectionTotal', () => {
        it('should retrieve section and return computed total', async () => {
            const mockSection = { id: 'section-1' };
            const expectedTotal = 3000;

            mockRoomSectionService.retrieveRoomSectionByCriteria.mockResolvedValue(mockSection);
            mockPreRCalculatorService.computeRSectionTotal = jest
                .fn()
                .mockReturnValue(expectedTotal);

            const result = await service.getSectionTotal('section-1');

            expect(mockTransformRCalculatorService.sectionExpenses).toHaveBeenCalled();
            expect(mockRoomSectionService.retrieveRoomSectionByCriteria).toHaveBeenCalledWith(
                { id: 'section-1' },
                ['rel6'],
            );
            expect(mockPreRCalculatorService.computeRSectionTotal).toHaveBeenCalledWith(
                mockSection,
            );
            expect(result).toBe(expectedTotal);
        });
    });

    describe('getExpenseRowTotal', () => {
        it('should retrieve expense record and return computed row total', async () => {
            const mockRecord = { id: 'expense-1' };
            const expectedTotal = 1500;

            mockRoomExpenseItemService.retrieveRExpenseByCriteria = jest
                .fn()
                .mockResolvedValue(mockRecord);
            mockPreRCalculatorService.computeREItemRowTotal = jest
                .fn()
                .mockReturnValue(expectedTotal);

            const result = await service.getExpenseRowTotal('expense-1');

            expect(mockRoomExpenseItemService.retrieveRExpenseByCriteria).toHaveBeenCalledWith({
                id: 'expense-1',
            });
            expect(mockPreRCalculatorService.computeREItemRowTotal).toHaveBeenCalledWith(
                mockRecord,
            );
            expect(result).toBe(expectedTotal);
        });
    });

    describe('fetchBuilderForRCalculator', () => {
        it('should fetch analysis and initialize the builder with given relations', async () => {
            const relations = ['rooms'];

            mockRAnalysisService.getAnalysis.mockResolvedValue(mockAnalysis);
            mockPreRCalculatorService.initializeRCalculatorForAnalysis.mockResolvedValue(
                mockABuilder,
            );

            const result = await service.fetchBuilderForRCalculator(
                mockUser,
                'analysis-1',
                relations,
            );

            expect(mockRAnalysisService.getAnalysis).toHaveBeenCalledWith(
                mockUser,
                'analysis-1',
                ModuleLabelEnum.REHAB_CALCULATOR,
                ['rel2'],
            );
            expect(mockPreRCalculatorService.initializeRCalculatorForAnalysis).toHaveBeenCalledWith(
                mockAnalysis,
                relations,
            );
            expect(result).toBe(mockABuilder);
        });
    });

    describe('resolveBuilderForAnalysis', () => {
        it('should return transformed result directly when rooms of this type already exist', async () => {
            const type = BAnalysisTypeEnum.INTERIOR_EXPENSES;
            const existingRoom = { id: 'room-1', type };
            const mockBuilderWithRooms = {
                ...mockABuilder,
                rooms: [existingRoom],
            } as unknown as BAnalysisEntity;
            const mockTransformed = { transformed: true };

            mockRAnalysisService.getAnalysis.mockResolvedValue(mockAnalysis);
            mockPreRCalculatorService.initializeRCalculatorForAnalysis.mockResolvedValue(
                mockBuilderWithRooms,
            );
            mockTransformRCalculatorService.transformRCBAnalysis.mockReturnValue(mockTransformed);

            const result = await service.resolveBuilderForAnalysis(mockUser, 'analysis-1', type);

            expect(mockLogger.info).toHaveBeenCalled();
            expect(mockRoomCategoryService.createRoomCategory).not.toHaveBeenCalled();
            expect(mockBAnalysisService.retrieveBAnalysisByCriteria).not.toHaveBeenCalled();
            expect(mockTransformRCalculatorService.transformRCBAnalysis).toHaveBeenCalledWith(
                [existingRoom],
                'analysis-1',
            );
            expect(result).toBe(mockTransformed);
        });

        it('should create room category, retrieve updated builder, and return transformed result when no rooms of this type exist', async () => {
            const type = BAnalysisTypeEnum.INTERIOR_EXPENSES;
            const mockUpdatedBuilder = {
                id: 'builder-1',
                rooms: [{ id: 'room-new', type }],
            } as unknown as BAnalysisEntity;
            const mockTransformed = { transformed: true };

            mockRAnalysisService.getAnalysis.mockResolvedValue(mockAnalysis);
            mockPreRCalculatorService.initializeRCalculatorForAnalysis.mockResolvedValue(
                mockABuilder,
            );
            mockRoomCategoryService.createRoomCategory.mockResolvedValue(undefined);
            mockBAnalysisService.retrieveBAnalysisByCriteria.mockResolvedValue(mockUpdatedBuilder);
            mockTransformRCalculatorService.transformRCBAnalysis.mockReturnValue(mockTransformed);

            const result = await service.resolveBuilderForAnalysis(mockUser, 'analysis-1', type);

            expect(mockRoomCategoryService.createRoomCategory).toHaveBeenCalledWith(
                mockABuilder,
                type,
            );
            expect(mockBAnalysisService.retrieveBAnalysisByCriteria).toHaveBeenCalledWith(
                { id: mockABuilder.id },
                ['rel3'],
            );
            expect(mockTransformRCalculatorService.transformRCBAnalysis).toHaveBeenCalledWith(
                [{ id: 'room-new', type }],
                'analysis-1',
            );
            expect(result).toBe(mockTransformed);
        });
    });

    describe('getRoomsByType', () => {
        it('should fetch builder and return transformed rooms filtered by type', async () => {
            const type = BAnalysisTypeEnum.INTERIOR_EXPENSES;
            const mockRooms = [
                { id: 'room-1', type },
                { id: 'room-2', type },
            ];
            const mockBuilderWithRooms = { ...mockABuilder, rooms: mockRooms };
            const mockTransformedRooms = [{ name: 'Room 1' }];

            mockRAnalysisService.getAnalysis.mockResolvedValue(mockAnalysis);
            mockPreRCalculatorService.initializeRCalculatorForAnalysis.mockResolvedValue(
                mockBuilderWithRooms,
            );
            mockTransformBAEntitiesService.transformRooms.mockReturnValue(mockTransformedRooms);

            const result = await service.getRoomsByType(mockUser, 'analysis-1', type);

            expect(mockLogger.info).toHaveBeenCalled();
            expect(mockTransformRCalculatorService.rCBuilderRooms).toHaveBeenCalled();
            expect(mockTransformBAEntitiesService.transformRooms).toHaveBeenCalledWith(mockRooms);
            expect(result).toBe(mockTransformedRooms);
        });
    });

    describe('getRoomSections', () => {
        it('should fetch room and return transformed sections', async () => {
            const mockSections = [{ id: 'section-1' }];
            const mockRoom = { id: 'room-1', sections: mockSections };
            const mockTransformedSections = [{ label: 'Flooring' }];

            mockRoomCategoryService.retrieveRoomCategoryByCriteria.mockResolvedValue(mockRoom);
            mockTransformBAEntitiesService.transformRoomSections.mockReturnValue(
                mockTransformedSections,
            );

            const result = await service.getRoomSections('room-1');

            expect(mockLogger.info).toHaveBeenCalled();
            expect(mockTransformRCalculatorService.roomEntities).toHaveBeenCalled();
            expect(mockRoomCategoryService.retrieveRoomCategoryByCriteria).toHaveBeenCalledWith(
                { id: 'room-1' },
                ['rel5'],
            );
            expect(mockTransformBAEntitiesService.transformRoomSections).toHaveBeenCalledWith(
                mockSections,
            );
            expect(result).toBe(mockTransformedSections);
        });
    });

    describe('getSectionRecords', () => {
        it('should fetch section and return transformed section with records', async () => {
            const mockSection = { id: 'section-1', expenses: [] };
            const mockTransformedSection = { label: 'Section 1', records: [] };

            mockRoomSectionService.retrieveRoomSectionByCriteria.mockResolvedValue(mockSection);
            mockTransformBAEntitiesService.transformRSection.mockReturnValue(
                mockTransformedSection,
            );

            const result = await service.getSectionRecords('section-1');

            expect(mockLogger.info).toHaveBeenCalled();
            expect(mockTransformRCalculatorService.sectionExpenses).toHaveBeenCalled();
            expect(mockRoomSectionService.retrieveRoomSectionByCriteria).toHaveBeenCalledWith(
                { id: 'section-1' },
                ['rel6'],
            );
            expect(mockTransformBAEntitiesService.transformRSection).toHaveBeenCalledWith(
                mockSection,
            );
            expect(result).toBe(mockTransformedSection);
        });
    });

    describe('addRoomByType', () => {
        it('should fetch builder, create room category with create=true, and return success message', async () => {
            mockRAnalysisService.getAnalysis.mockResolvedValue(mockAnalysis);
            mockPreRCalculatorService.initializeRCalculatorForAnalysis.mockResolvedValue(
                mockABuilder,
            );
            mockRoomCategoryService.createRoomCategory.mockResolvedValue(undefined);

            const result = await service.addRoomByType(
                mockUser,
                'analysis-1',
                BAnalysisTypeEnum.INTERIOR_EXPENSES,
            );

            expect(mockLogger.info).toHaveBeenCalled();
            expect(mockRoomCategoryService.createRoomCategory).toHaveBeenCalledWith(
                mockABuilder,
                BAnalysisTypeEnum.INTERIOR_EXPENSES,
                true,
            );
            expect(result).toEqual({ message: 'New room created successfully.' });
        });
    });

    describe('addSectionRoom', () => {
        it('should retrieve room, create sections, and return success message', async () => {
            const mockRoom = { id: 'room-1' };
            const labels = ['Flooring', 'Ceiling', 'Walls'];

            mockRoomCategoryService.retrieveRoomCategoryByCriteria.mockResolvedValue(mockRoom);
            mockRoomSectionService.createManyRSections.mockResolvedValue(undefined);

            const result = await service.addSectionRoom('room-1', labels);

            expect(mockLogger.info).toHaveBeenCalled();
            expect(mockRoomCategoryService.retrieveRoomCategoryByCriteria).toHaveBeenCalledWith({
                id: 'room-1',
            });
            expect(mockRoomSectionService.createManyRSections).toHaveBeenCalledWith(
                mockRoom,
                labels,
            );
            expect(result).toEqual({ message: 'New sections added to room successfully.' });
        });
    });

    describe('addRecordToSection', () => {
        it('should retrieve section, resolve expense item, and return success message', async () => {
            const mockSection = { id: 'section-1' };
            const mockData: ResolveREItemDto = { label: 'Paint', cost: 200 } as any;

            mockRoomSectionService.retrieveRoomSectionByCriteria.mockResolvedValue(mockSection);
            mockRoomExpenseItemService.resolveREItem.mockResolvedValue(undefined);

            const result = await service.addRecordToSection('section-1', mockData);

            expect(mockLogger.info).toHaveBeenCalled();
            expect(mockRoomSectionService.retrieveRoomSectionByCriteria).toHaveBeenCalledWith({
                id: 'section-1',
            });
            expect(mockRoomExpenseItemService.resolveREItem).toHaveBeenCalledWith(
                mockSection,
                mockData,
            );
            expect(result).toEqual({ message: 'Record added to section successfully.' });
        });
    });

    describe('listBuilder', () => {
        it('should fetch analysis and return the associated builder with summary entities', async () => {
            mockRAnalysisService.getAnalysis.mockResolvedValue(mockAnalysis);
            mockBAnalysisService.retrieveBAnalysisByCriteria.mockResolvedValue(mockABuilder);

            const result = await service.listBuilder(mockUser, 'analysis-1');

            expect(mockRAnalysisService.getAnalysis).toHaveBeenCalledWith(
                mockUser,
                'analysis-1',
                ModuleLabelEnum.REHAB_CALCULATOR,
                ['rel2'],
            );
            expect(mockTransformRCalculatorService.rCalculatorSummaryEntities).toHaveBeenCalled();
            expect(mockBAnalysisService.retrieveBAnalysisByCriteria).toHaveBeenCalledWith(
                { id: 'ab-1' },
                ['rel2'],
            );
            expect(result).toBe(mockABuilder);
        });
    });

    describe('getRCSummary', () => {
        it('should fetch analysis and builder, then return computed summary', async () => {
            const mockSummary = { totalProjectCost: 15000, categories: [] };

            mockRAnalysisService.getAnalysis.mockResolvedValue(mockAnalysis);
            mockBAnalysisService.retrieveBAnalysisByCriteria.mockResolvedValue(mockABuilder);
            mockPreRCalculatorService.rCalculatorSummary.mockReturnValue(mockSummary);

            const result = await service.getRCSummary(mockUser, 'analysis-1');

            expect(mockLogger.info).toHaveBeenCalled();
            expect(mockRAnalysisService.getAnalysis).toHaveBeenCalledWith(
                mockUser,
                'analysis-1',
                ModuleLabelEnum.REHAB_CALCULATOR,
                ['rel2'],
            );
            expect(mockBAnalysisService.retrieveBAnalysisByCriteria).toHaveBeenCalledWith(
                { id: 'ab-1' },
                ['rel2'],
            );
            expect(mockPreRCalculatorService.rCalculatorSummary).toHaveBeenCalledWith(mockABuilder);
            expect(result).toBe(mockSummary);
        });
    });

    describe('getRCPunchList', () => {
        it('should fetch builder via listBuilder and return computed punch list', async () => {
            const mockPunchList = { totalProjectCost: 10000, rooms: [] };

            mockRAnalysisService.getAnalysis.mockResolvedValue(mockAnalysis);
            mockBAnalysisService.retrieveBAnalysisByCriteria.mockResolvedValue(mockABuilder);
            mockPreRCalculatorService.getPunchList.mockReturnValue(mockPunchList);

            const result = await service.getRCPunchList(mockUser, 'analysis-1');

            expect(mockLogger.info).toHaveBeenCalled();
            expect(mockRAnalysisService.getAnalysis).toHaveBeenCalledWith(
                mockUser,
                'analysis-1',
                ModuleLabelEnum.REHAB_CALCULATOR,
                ['rel2'],
            );
            expect(mockBAnalysisService.retrieveBAnalysisByCriteria).toHaveBeenCalledWith(
                { id: 'ab-1' },
                ['rel2'],
            );
            expect(mockPreRCalculatorService.getPunchList).toHaveBeenCalledWith(mockABuilder);
            expect(result).toBe(mockPunchList);
        });
    });
});
