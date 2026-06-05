import { Test, TestingModule } from '@nestjs/testing';
import { In } from 'typeorm';
import { RoomSectionService } from './room-section.service';
import { BAnalysisService } from './b-analysis.service';
import { RoomCategoryEntity, RoomExpenseItemEntity, RoomSectionEntity } from '../entities';
import { RoomDefaultSectionEnum } from '../../../common/enum';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('RoomSectionService', () => {
    let service: RoomSectionService;

    const mockRoomSectionRepo = {
        findActiveOne: jest.fn(),
        assertUniqueActive: jest.fn(),
        create: jest.fn(),
        createMany: jest.fn(),
        find: jest.fn(),
        update: jest.fn(),
    };

    const mockErrorHandler = {
        notFound: jest.fn(),
        validation: jest.fn(),
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
        roomSectionRepo: mockRoomSectionRepo,
        errorHandler: mockErrorHandler,
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RoomSectionService,
                { provide: BAnalysisService, useValue: mockBAnalysisService },
            ],
        }).compile();

        service = module.get<RoomSectionService>(RoomSectionService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('buildRSection', () => {
        it('should return a RoomSectionEntity with label and roomCategory assigned', () => {
            const roomCategory = { id: 'cat-1' } as RoomCategoryEntity;

            const result = service.buildRSection({ label: 'Bathroom', roomCategory });

            expect(result).toBeInstanceOf(RoomSectionEntity);
            expect(result.label).toBe('Bathroom');
            expect(result.roomCategory).toBe(roomCategory);
        });

        it('should return a RoomSectionEntity without optional roomCategory', () => {
            const result = service.buildRSection({ label: 'Kitchen' });

            expect(result).toBeInstanceOf(RoomSectionEntity);
            expect(result.label).toBe('Kitchen');
            expect(result.roomCategory).toBeUndefined();
        });
    });

    describe('retrieveRoomSectionByCriteria', () => {
        const criteria = { id: 'sec-1' };
        const relations = ['expenseItems'];

        it('should return the entity when it exists', async () => {
            const entity = new RoomSectionEntity();
            mockOtherUtils.formatCriteria.mockReturnValue('id=sec-1');
            mockRoomSectionRepo.findActiveOne.mockResolvedValue(entity);

            const result = await service.retrieveRoomSectionByCriteria(criteria, relations);

            expect(mockOtherUtils.formatCriteria).toHaveBeenCalledWith(criteria);
            expect(mockLogger.info).toHaveBeenCalledWith('Find room section by id=sec-1');
            expect(mockRoomSectionRepo.findActiveOne).toHaveBeenCalledWith(
                mockRoomSectionRepo,
                criteria,
                relations,
            );
            expect(mockErrorHandler.notFound).not.toHaveBeenCalled();
            expect(result).toBe(entity);
        });

        it('should call errorHandler.notFound when entity does not exist', async () => {
            mockOtherUtils.formatCriteria.mockReturnValue('id=sec-1');
            mockRoomSectionRepo.findActiveOne.mockResolvedValue(null);

            await service.retrieveRoomSectionByCriteria(criteria, relations);

            expect(mockErrorHandler.notFound).toHaveBeenCalledWith(
                'Room section not found with id=sec-1',
                'Room section not found',
            );
        });

        it('should work without the optional relations parameter', async () => {
            const entity = new RoomSectionEntity();
            mockOtherUtils.formatCriteria.mockReturnValue('id=sec-1');
            mockRoomSectionRepo.findActiveOne.mockResolvedValue(entity);

            const result = await service.retrieveRoomSectionByCriteria(criteria);

            expect(mockRoomSectionRepo.findActiveOne).toHaveBeenCalledWith(
                mockRoomSectionRepo,
                criteria,
                undefined,
            );
            expect(result).toBe(entity);
        });
    });

    describe('ensureUniqueRSectionLabel', () => {
        it('should pass without throwing when no duplicate exists', async () => {
            mockRoomSectionRepo.assertUniqueActive.mockResolvedValue(undefined);

            await expect(service.ensureUniqueRSectionLabel('Unique Label')).resolves.not.toThrow();

            expect(mockRoomSectionRepo.assertUniqueActive).toHaveBeenCalledWith(
                mockRoomSectionRepo,
                {},
                { label: 'Unique Label' },
                'Room section',
            );
            expect(mockErrorHandler.validation).not.toHaveBeenCalled();
        });

        it('should throw a validation error when a duplicate label exists', async () => {
            const validationError = new Error('Validation error');
            mockErrorHandler.validation.mockReturnValue(validationError);

            mockRoomSectionRepo.assertUniqueActive.mockImplementation(
                async (_repo, errors, _criteria, _label) => {
                    errors['label'] = 'Room section already exists';
                },
            );

            await expect(service.ensureUniqueRSectionLabel('Duplicate Label')).rejects.toThrow(
                validationError,
            );

            expect(mockErrorHandler.validation).toHaveBeenCalledWith({
                label: 'Room section already exists',
            });
        });
    });

    describe('createRSection', () => {
        const roomCategory = { id: 'cat-1' } as RoomCategoryEntity;

        it('should validate label uniqueness then persist and return entity', async () => {
            const createdSection = new RoomSectionEntity();
            mockRoomSectionRepo.assertUniqueActive.mockResolvedValue(undefined);
            mockRoomSectionRepo.create.mockResolvedValue(createdSection);

            const result = await service.createRSection(roomCategory, 'Living Room');

            expect(mockRoomSectionRepo.assertUniqueActive).toHaveBeenCalled();
            expect(mockRoomSectionRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({ label: 'Living Room', roomCategory }),
            );
            expect(result).toBe(createdSection);
        });

        it('should throw when label is not unique', async () => {
            const validationError = new Error('Validation error');
            mockErrorHandler.validation.mockReturnValue(validationError);
            mockRoomSectionRepo.assertUniqueActive.mockImplementation(async (_repo, errors) => {
                errors['label'] = 'Room section already exists';
            });

            await expect(service.createRSection(roomCategory, 'Duplicate')).rejects.toThrow(
                validationError,
            );

            expect(mockRoomSectionRepo.create).not.toHaveBeenCalled();
        });
    });

    describe('createManyRSections', () => {
        const roomCategory = { id: 'cat-1' } as RoomCategoryEntity;
        const labels = ['Kitchen', 'Bathroom'];

        it('should create many sections when no duplicates exist', async () => {
            const createdSections = [new RoomSectionEntity(), new RoomSectionEntity()];
            mockRoomSectionRepo.find.mockResolvedValue([]);
            mockRoomSectionRepo.createMany.mockResolvedValue(createdSections);

            const result = await service.createManyRSections(roomCategory, labels);

            expect(mockRoomSectionRepo.find).toHaveBeenCalledWith({
                where: { label: In(labels), deleted: false },
            });
            expect(mockRoomSectionRepo.createMany).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({ label: 'Kitchen', roomCategory }),
                    expect.objectContaining({ label: 'Bathroom', roomCategory }),
                ]),
            );
            expect(result).toBe(createdSections);
        });

        it('should call validation error when duplicate labels exist', async () => {
            const duplicate = Object.assign(new RoomSectionEntity(), { label: 'Kitchen' });
            mockRoomSectionRepo.find.mockResolvedValue([duplicate]);

            mockErrorHandler.validation.mockImplementation((errors) => {
                throw new Error(JSON.stringify(errors));
            });

            await expect(service.createManyRSections(roomCategory, labels)).rejects.toThrow();

            expect(mockErrorHandler.validation).toHaveBeenCalledWith({
                Kitchen: "Room section 'Kitchen' already exists",
            });
            expect(mockRoomSectionRepo.createMany).not.toHaveBeenCalled();
        });
    });

    describe('updateRSection', () => {
        const section = Object.assign(new RoomSectionEntity(), { id: 'sec-1' });

        it('should return a message when no itemized data is provided', async () => {
            const result = await service.updateRSection(section);
            expect(result).toEqual({ message: 'No updates provided for room section' });
            expect(mockRoomSectionRepo.update).not.toHaveBeenCalled();
        });

        it('should return a message when itemized is an empty object', async () => {
            const result = await service.updateRSection(section, {});
            expect(result).toEqual({ message: 'No updates provided for room section' });
            expect(mockRoomSectionRepo.update).not.toHaveBeenCalled();
        });

        it('should trim and update label when provided', async () => {
            const updateResult = { affected: 1 };
            mockRoomSectionRepo.update.mockResolvedValue(updateResult);

            const result = await service.updateRSection(section, { label: '  Kitchen  ' });

            expect(mockRoomSectionRepo.update).toHaveBeenCalledWith(
                { id: 'sec-1' },
                { label: 'Kitchen' },
            );
            expect(result).toBe(updateResult);
        });

        it('should not update label when it is an empty string after trim', async () => {
            const updateResult = { affected: 0 };
            mockRoomSectionRepo.update.mockResolvedValue(updateResult);

            await service.updateRSection(section, { label: '   ' });

            expect(mockRoomSectionRepo.update).toHaveBeenCalledWith({ id: 'sec-1' }, {});
        });
    });

    describe('createRoomDefaultSections', () => {
        it('should call createManyRSections with all RoomDefaultSectionEnum values', async () => {
            const roomCategory = { id: 'cat-1' } as RoomCategoryEntity;
            const createdSections = [new RoomSectionEntity()];
            const defaultLabels = Object.values(RoomDefaultSectionEnum);

            mockRoomSectionRepo.find.mockResolvedValue([]);
            mockRoomSectionRepo.createMany.mockResolvedValue(createdSections);

            const result = await service.createRoomDefaultSections(roomCategory);

            expect(mockRoomSectionRepo.find).toHaveBeenCalledWith({
                where: { label: In(defaultLabels), deleted: false },
            });
            expect(result).toBe(createdSections);
        });
    });
});
