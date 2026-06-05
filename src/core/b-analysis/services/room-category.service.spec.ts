import { Test, TestingModule } from '@nestjs/testing';
import { RoomCategoryService } from './room-category.service';
import { BAnalysisService } from './b-analysis.service';
import { BAnalysisEntity, RoomCategoryEntity } from '../entities';
import { BAnalysisTypeEnum } from '../../../common/enum';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('RoomCategoryService', () => {
    let service: RoomCategoryService;

    const mockRoomCategoryRepo = {
        count: jest.fn(),
        create: jest.fn(),
        findActiveOne: jest.fn(),
    };

    const mockRoomSectionService = {
        createRoomDefaultSections: jest.fn(),
    };

    const mockErrorHandler = {
        notFound: jest.fn(),
    };

    const mockOtherUtils = {
        formatCriteria: jest.fn(),
    };

    const mockLogger = {
        info: jest.fn(),
    };

    const mockBAnalysisService = {
        otherUtils: mockOtherUtils,
        logger: mockLogger,
        roomCategoryRepo: mockRoomCategoryRepo,
        roomSectionService: mockRoomSectionService,
        errorHandler: mockErrorHandler,
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RoomCategoryService,
                { provide: BAnalysisService, useValue: mockBAnalysisService },
            ],
        }).compile();

        service = module.get<RoomCategoryService>(RoomCategoryService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('buildRCategory', () => {
        it('should return a RoomCategoryEntity with all fields assigned', () => {
            const bAnalysis = { id: 'ba-1' } as BAnalysisEntity;
            const required = {
                label: 'Room 1',
                type: BAnalysisTypeEnum.EXTERIOR_EXPENSES,
                bAnalysis,
            };

            const result = service.buildRCategory(required);

            expect(result).toBeInstanceOf(RoomCategoryEntity);
            expect(result.label).toBe('Room 1');
            expect(result.type).toBe(BAnalysisTypeEnum.EXTERIOR_EXPENSES);
            expect(result.bAnalysis).toBe(bAnalysis);
        });

        it('should return a RoomCategoryEntity without optional bAnalysis', () => {
            const result = service.buildRCategory({
                label: 'Room 2',
                type: BAnalysisTypeEnum.EXTERIOR_EXPENSES,
            });

            expect(result).toBeInstanceOf(RoomCategoryEntity);
            expect(result.label).toBe('Room 2');
            expect(result.bAnalysis).toBeUndefined();
        });
    });

    describe('retrieveRoomCategoryByCriteria', () => {
        const criteria = { id: 'cat-1' };
        const relations = ['sections'];

        it('should return the entity when it exists', async () => {
            const entity = new RoomCategoryEntity();
            mockOtherUtils.formatCriteria.mockReturnValue('id=cat-1');
            mockRoomCategoryRepo.findActiveOne.mockResolvedValue(entity);

            const result = await service.retrieveRoomCategoryByCriteria(criteria, relations);

            expect(mockOtherUtils.formatCriteria).toHaveBeenCalledWith(criteria);
            expect(mockLogger.info).toHaveBeenCalledWith('Find room category by id=cat-1');
            expect(mockRoomCategoryRepo.findActiveOne).toHaveBeenCalledWith(
                mockRoomCategoryRepo,
                criteria,
                relations,
            );
            expect(mockErrorHandler.notFound).not.toHaveBeenCalled();
            expect(result).toBe(entity);
        });

        it('should call errorHandler.notFound when entity does not exist', async () => {
            mockOtherUtils.formatCriteria.mockReturnValue('id=cat-1');
            mockRoomCategoryRepo.findActiveOne.mockResolvedValue(null);

            await service.retrieveRoomCategoryByCriteria(criteria, relations);

            expect(mockErrorHandler.notFound).toHaveBeenCalledWith(
                'Room category not found with id=cat-1',
                'Room category not found',
            );
        });

        it('should work without the optional relations parameter', async () => {
            const entity = new RoomCategoryEntity();
            mockOtherUtils.formatCriteria.mockReturnValue('id=cat-1');
            mockRoomCategoryRepo.findActiveOne.mockResolvedValue(entity);

            const result = await service.retrieveRoomCategoryByCriteria(criteria);

            expect(mockRoomCategoryRepo.findActiveOne).toHaveBeenCalledWith(
                mockRoomCategoryRepo,
                criteria,
                undefined,
            );
            expect(result).toBe(entity);
        });
    });

    describe('createRoomCategory', () => {
        const type = BAnalysisTypeEnum.EXTERIOR_EXPENSES;

        it('should create a new room when no rooms of this type exist', async () => {
            const bAnalysis = { id: 'ba-1', rooms: [] } as unknown as BAnalysisEntity;
            const createdRoom = new RoomCategoryEntity();

            mockRoomCategoryRepo.create.mockResolvedValue(createdRoom);
            mockRoomSectionService.createRoomDefaultSections.mockResolvedValue(undefined);

            const result = await service.createRoomCategory(bAnalysis, type);

            expect(mockRoomCategoryRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({ label: 'Room 1', type, bAnalysis }),
            );
            expect(mockRoomSectionService.createRoomDefaultSections).toHaveBeenCalledWith(
                createdRoom,
            );
            expect(result).toBe(createdRoom);
        });

        it('should create a new room when create=true even if rooms of this type exist', async () => {
            const existingRoom = Object.assign(new RoomCategoryEntity(), { type });
            const bAnalysis = { id: 'ba-1', rooms: [existingRoom] } as unknown as BAnalysisEntity;
            const createdRoom = new RoomCategoryEntity();

            mockRoomCategoryRepo.create.mockResolvedValue(createdRoom);
            mockRoomSectionService.createRoomDefaultSections.mockResolvedValue(undefined);

            const result = await service.createRoomCategory(bAnalysis, type, true);

            // roomsOfType.length = 1, so label = "Room 2"
            expect(mockRoomCategoryRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({ label: 'Room 2', type, bAnalysis }),
            );
            expect(result).toBe(createdRoom);
        });

        it('should return existing room when one of this type exists and create=false', async () => {
            const existingRoom = Object.assign(new RoomCategoryEntity(), { type });
            const bAnalysis = { id: 'ba-1', rooms: [existingRoom] } as unknown as BAnalysisEntity;

            const result = await service.createRoomCategory(bAnalysis, type);

            expect(mockRoomCategoryRepo.create).not.toHaveBeenCalled();
            expect(mockRoomSectionService.createRoomDefaultSections).not.toHaveBeenCalled();
            expect(result).toBe(existingRoom);
        });

        it('should generate label "Room 1" when rooms is undefined', async () => {
            const bAnalysis = { id: 'ba-1', rooms: undefined } as unknown as BAnalysisEntity;
            const createdRoom = new RoomCategoryEntity();

            mockRoomCategoryRepo.create.mockResolvedValue(createdRoom);
            mockRoomSectionService.createRoomDefaultSections.mockResolvedValue(undefined);

            await service.createRoomCategory(bAnalysis, type);

            expect(mockRoomCategoryRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({ label: 'Room 1' }),
            );
        });
    });
});
