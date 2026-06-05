import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { BAnalysisService } from './b-analysis.service';
import { ErrorHandlerService } from '../../../common/response';
import { OtherUtils } from '../../../utils/services/tools';
import {
    BAnalysisRepository,
    RoomCategoryRepository,
    RoomExpenseItemRepository,
    RoomSectionRepository,
} from '../repositories';
import { RoomExpenseItemService } from './room-expense-item.service';
import { RoomSectionService } from './room-section.service';
import { RoomCategoryService } from './room-category.service';
import { TransformBAEntitiesService } from './transform-b-a-entities.service';
import { RCalculatorEntity } from '../../r-calculator/entity/r-calculator.entity';
import { BAnalysisEntity } from '../entities';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('BAnalysisService', () => {
    let service: BAnalysisService;

    const mockLogger = { info: jest.fn(), error: jest.fn() };

    const mockBAnalysisRepo = {
        findOne: jest.fn(),
        create: jest.fn(),
        findActiveOne: jest.fn(),
    };

    const mockRoomCategoryService = {
        createRoomCategory: jest.fn(),
    };

    const mockRoomSectionService = {};
    const mockRoomExpenseItemService = {};
    const mockTransformBAEntitiesService = {};

    const mockRoomCategoryRepo = {};
    const mockRoomSectionRepo = {};
    const mockRoomExpenseItemRepo = {};

    const mockErrorHandler = {
        notFound: jest.fn(),
    };

    const mockOtherUtils = {
        formatCriteria: jest.fn(),
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BAnalysisService,
                { provide: WINSTON_MODULE_PROVIDER, useValue: mockLogger },
                { provide: RoomCategoryService, useValue: mockRoomCategoryService },
                { provide: RoomSectionService, useValue: mockRoomSectionService },
                { provide: RoomExpenseItemService, useValue: mockRoomExpenseItemService },
                { provide: TransformBAEntitiesService, useValue: mockTransformBAEntitiesService },
                { provide: BAnalysisRepository, useValue: mockBAnalysisRepo },
                { provide: RoomCategoryRepository, useValue: mockRoomCategoryRepo },
                { provide: RoomSectionRepository, useValue: mockRoomSectionRepo },
                { provide: RoomExpenseItemRepository, useValue: mockRoomExpenseItemRepo },
                { provide: ErrorHandlerService, useValue: mockErrorHandler },
                { provide: OtherUtils, useValue: mockOtherUtils },
            ],
        }).compile();

        service = module.get<BAnalysisService>(BAnalysisService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('buildBAnalysis', () => {
        it('should return a BAnalysisEntity with rCalculator assigned', () => {
            const rCalculator = { id: 'calc-1' } as RCalculatorEntity;

            const result = service.buildBAnalysis({ rCalculator });

            expect(result).toBeInstanceOf(BAnalysisEntity);
            expect(result.rCalculator).toBe(rCalculator);
        });

        it('should return a BAnalysisEntity when rCalculator is undefined', () => {
            const result = service.buildBAnalysis({});

            expect(result).toBeInstanceOf(BAnalysisEntity);
            expect(result.rCalculator).toBeUndefined();
        });
    });

    describe('createBAnalysis', () => {
        it('should return existing bAnalysis if one already exists', async () => {
            const rCalculator = { id: 'calc-1' } as RCalculatorEntity;
            const existing = new BAnalysisEntity();

            mockBAnalysisRepo.findOne.mockResolvedValue(existing);

            const result = await service.createBAnalysis(rCalculator);

            expect(mockBAnalysisRepo.findOne).toHaveBeenCalledWith({
                where: { rCalculator: { id: 'calc-1' }, deleted: false },
            });
            expect(mockBAnalysisRepo.create).not.toHaveBeenCalled();
            expect(result).toBe(existing);
        });

        it('should create a new BAnalysisEntity if none exists', async () => {
            const rCalculator = { id: 'calc-1' } as RCalculatorEntity;
            const created = new BAnalysisEntity();

            mockBAnalysisRepo.findOne.mockResolvedValue(null);
            mockBAnalysisRepo.create.mockResolvedValue(created);

            const result = await service.createBAnalysis(rCalculator);

            expect(mockBAnalysisRepo.create).toHaveBeenCalledWith(expect.any(BAnalysisEntity));
            expect(result).toBe(created);
        });
    });

    describe('retrieveBAnalysisByCriteria', () => {
        const criteria = { id: 'analysis-1' };
        const relations = ['roomCategories'];

        it('should return the entity when it exists', async () => {
            const entity = new BAnalysisEntity();
            mockOtherUtils.formatCriteria.mockReturnValue('id=analysis-1');
            mockBAnalysisRepo.findActiveOne.mockResolvedValue(entity);

            const result = await service.retrieveBAnalysisByCriteria(criteria, relations);

            expect(mockOtherUtils.formatCriteria).toHaveBeenCalledWith(criteria);
            expect(mockLogger.info).toHaveBeenCalledWith(
                'Find rehab calculator analysis builder by id=analysis-1',
            );
            expect(mockBAnalysisRepo.findActiveOne).toHaveBeenCalledWith(
                mockBAnalysisRepo,
                criteria,
                relations,
            );
            expect(mockErrorHandler.notFound).not.toHaveBeenCalled();
            expect(result).toBe(entity);
        });

        it('should call errorHandler.notFound when entity does not exist', async () => {
            mockOtherUtils.formatCriteria.mockReturnValue('id=analysis-1');
            mockBAnalysisRepo.findActiveOne.mockResolvedValue(null);

            await service.retrieveBAnalysisByCriteria(criteria, relations);

            expect(mockErrorHandler.notFound).toHaveBeenCalledWith(
                'Analysis not found with id=analysis-1',
                'Analysis not found',
            );
        });

        it('should work without the optional relations parameter', async () => {
            const entity = new BAnalysisEntity();
            mockOtherUtils.formatCriteria.mockReturnValue('id=analysis-1');
            mockBAnalysisRepo.findActiveOne.mockResolvedValue(entity);

            const result = await service.retrieveBAnalysisByCriteria(criteria);

            expect(mockBAnalysisRepo.findActiveOne).toHaveBeenCalledWith(
                mockBAnalysisRepo,
                criteria,
                undefined,
            );
            expect(result).toBe(entity);
        });
    });
});
