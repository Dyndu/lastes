import { Test, TestingModule } from '@nestjs/testing';
import { PreRCalculatorService } from './pre-r-calculator.service';
import { RCalculatorService } from './r-calculator.service';
import { RCalculatorEntity } from '../entity/r-calculator.entity';
import { AnalysisEntity } from '../../analysis/entities/analysis.entity';
import { BAnalysisTypeEnum } from '../../../common/enum';
import {
    RoomCategoryEntity,
    RoomSectionEntity,
    RoomExpenseItemEntity,
} from '../../b-analysis/entities';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('PreRCalculatorService', () => {
    let service: PreRCalculatorService;

    const mockResolveTotal = jest.fn();

    const mockRoomExpenseItemService = {
        resolveTotal: mockResolveTotal,
    };

    const mockRCalculatorRepo = {
        findOne: jest.fn(),
        create: jest.fn(),
    };

    const mockBAnalysisService = {
        createBAnalysis: jest.fn(),
        createBAnalysisAndRelatedEntities: jest.fn(),
        retrieveBAnalysisByCriteria: jest.fn(),
        roomExpenseItemService: mockRoomExpenseItemService,
    };

    const mockTransformRCalculatorService = {
        rCalculatorABuilderEntities: jest.fn().mockReturnValue(['rooms', 'rooms.sections']),
    };

    const mockRCalculatorService = {
        bAnalysisService: mockBAnalysisService,
        rCalculatorRepo: mockRCalculatorRepo,
        transformRCalculatorService: mockTransformRCalculatorService,
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PreRCalculatorService,
                { provide: RCalculatorService, useValue: mockRCalculatorService },
            ],
        }).compile();

        service = module.get<PreRCalculatorService>(PreRCalculatorService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('computeREItemRowTotal', () => {
        it('should delegate to resolveTotal with correct dto values', () => {
            const dto = {
                cMethod: 'labor',
                laborValue: 100,
                materialValue: 50,
                total: null,
            } as unknown as RoomExpenseItemEntity;

            mockResolveTotal.mockReturnValue(150);

            const result = service.computeREItemRowTotal(dto);

            expect(mockResolveTotal).toHaveBeenCalledWith(
                dto.cMethod,
                dto.laborValue,
                dto.materialValue,
                dto.total,
            );
            expect(result).toBe(150);
        });

        it('should return whatever resolveTotal returns (including null)', () => {
            const dto = {
                cMethod: 'manual',
                laborValue: 0,
                materialValue: 0,
                total: null,
            } as unknown as RoomExpenseItemEntity;
            mockResolveTotal.mockReturnValue(null);

            const result = service.computeREItemRowTotal(dto);

            expect(result).toBeNull();
        });
    });

    describe('computeRSectionTotal', () => {
        it('should sum all item totals', () => {
            mockResolveTotal.mockReturnValueOnce(100).mockReturnValueOnce(200);

            const dto = {
                expenses: [
                    { cMethod: 'labor', laborValue: 100, materialValue: 0, total: null },
                    { cMethod: 'labor', laborValue: 200, materialValue: 0, total: null },
                ],
            } as unknown as RoomSectionEntity;

            const result = service.computeRSectionTotal(dto);

            expect(result).toBe(300);
            expect(mockResolveTotal).toHaveBeenCalledTimes(2);
        });

        it('should treat null/undefined item totals as 0', () => {
            mockResolveTotal.mockReturnValueOnce(null).mockReturnValueOnce(undefined);

            const dto = {
                expenses: [
                    { cMethod: 'labor', laborValue: 0, materialValue: 0, total: null },
                    { cMethod: 'labor', laborValue: 0, materialValue: 0, total: null },
                ],
            } as unknown as RoomSectionEntity;

            const result = service.computeRSectionTotal(dto);

            expect(result).toBe(0);
        });

        it('should return 0 when items array is empty', () => {
            const dto = { expenses: [] } as unknown as RoomSectionEntity;

            const result = service.computeRSectionTotal(dto);

            expect(result).toBe(0);
            expect(mockResolveTotal).not.toHaveBeenCalled();
        });
    });

    describe('computeRoomTotal', () => {
        it('should sum all expenses across all sections', () => {
            const expense1 = Object.assign(new RoomExpenseItemEntity(), { total: 100 });
            const expense2 = Object.assign(new RoomExpenseItemEntity(), { total: 200 });
            const expense3 = Object.assign(new RoomExpenseItemEntity(), { total: 50 });

            const section1 = Object.assign(new RoomSectionEntity(), {
                expenses: [expense1, expense2],
            });
            const section2 = Object.assign(new RoomSectionEntity(), { expenses: [expense3] });

            const room = Object.assign(new RoomCategoryEntity(), {
                sections: [section1, section2],
            });

            const result = service.computeRoomTotal(room);

            expect(result).toBe(350);
        });

        it('should return 0 when room has no sections', () => {
            const room = Object.assign(new RoomCategoryEntity(), { sections: [] });

            const result = service.computeRoomTotal(room);

            expect(result).toBe(0);
        });

        it('should return 0 when sections have no expenses', () => {
            const section = Object.assign(new RoomSectionEntity(), { expenses: [] });
            const room = Object.assign(new RoomCategoryEntity(), { sections: [section] });

            const result = service.computeRoomTotal(room);

            expect(result).toBe(0);
        });
    });

    describe('buildRCalculator', () => {
        it('should return a RCalculatorEntity with analysis assigned', () => {
            const analysis = { id: 'analysis-1' } as AnalysisEntity;

            const result = service.buildRCalculator({ analysis });

            expect(result).toBeInstanceOf(RCalculatorEntity);
            expect(result.analysis).toBe(analysis);
        });
    });

    describe('initializeRCalculatorForAnalysis', () => {
        it('should use existing rCalculator if one exists, then retrieve b-analysis', async () => {
            const analysis = { id: 'analysis-1' } as AnalysisEntity;
            const relations = ['rooms', 'rooms.sections'];
            const existingRCalculator = new RCalculatorEntity();
            const createdBAnalysis = { id: 'ba-1' };
            const retrievedBAnalysis = { id: 'ba-1', rooms: [] };

            mockRCalculatorRepo.findOne.mockResolvedValue(existingRCalculator);
            mockBAnalysisService.createBAnalysis.mockResolvedValue(createdBAnalysis);
            mockBAnalysisService.retrieveBAnalysisByCriteria.mockResolvedValue(retrievedBAnalysis);

            const result = await service.initializeRCalculatorForAnalysis(analysis, relations);

            expect(mockRCalculatorRepo.create).not.toHaveBeenCalled();
            expect(mockBAnalysisService.createBAnalysis).toHaveBeenCalledWith(existingRCalculator);
            expect(mockBAnalysisService.retrieveBAnalysisByCriteria).toHaveBeenCalledWith(
                { id: 'ba-1' },
                relations,
            );
            expect(result).toBe(retrievedBAnalysis);
        });

        it('should create a new rCalculator when none exists, then retrieve b-analysis', async () => {
            const analysis = { id: 'analysis-1' } as AnalysisEntity;
            const relations = ['rooms', 'rooms.sections'];
            const createdRCalculator = new RCalculatorEntity();
            const createdBAnalysis = { id: 'ba-1' };
            const retrievedBAnalysis = { id: 'ba-1', rooms: [] };

            mockRCalculatorRepo.findOne.mockResolvedValue(null);
            mockRCalculatorRepo.create.mockResolvedValue(createdRCalculator);
            mockBAnalysisService.createBAnalysis.mockResolvedValue(createdBAnalysis);
            mockBAnalysisService.retrieveBAnalysisByCriteria.mockResolvedValue(retrievedBAnalysis);

            const result = await service.initializeRCalculatorForAnalysis(analysis, relations);

            expect(mockRCalculatorRepo.create).toHaveBeenCalledWith(expect.any(RCalculatorEntity));
            expect(mockBAnalysisService.createBAnalysis).toHaveBeenCalledWith(createdRCalculator);
            expect(result).toBe(retrievedBAnalysis);
        });
    });

    describe('mapExpense', () => {
        it('should map a room expense entity to an expense DTO', () => {
            const expense = Object.assign(new RoomExpenseItemEntity(), {
                id: 'expense-1',
                label: 'Paint',
                laborValue: '100',
                materialValue: '50',
                total: '150',
            });

            const result = service.mapExpense(expense);

            expect(result).toEqual({
                id: 'expense-1',
                label: 'Paint',
                labor: 100,
                material: 50,
                total: 150,
            });
        });

        it('should default numeric fields to 0 when values are null/undefined', () => {
            const expense = Object.assign(new RoomExpenseItemEntity(), {
                id: 'expense-2',
                label: 'Flooring',
                laborValue: null,
                materialValue: undefined,
                total: null,
            });

            const result = service.mapExpense(expense);

            expect(result).toEqual({
                id: 'expense-2',
                label: 'Flooring',
                labor: 0,
                material: 0,
                total: 0,
            });
        });
    });

    describe('mapSection', () => {
        it('should map a room section entity with expenses to a section DTO', () => {
            const expense = Object.assign(new RoomExpenseItemEntity(), {
                id: 'expense-1',
                label: 'Paint',
                laborValue: 100,
                materialValue: 50,
                total: 150,
            });

            const section = Object.assign(new RoomSectionEntity(), {
                id: 'section-1',
                label: 'Walls',
                expenses: [expense],
            });

            const result = service.mapSection(section);

            expect(result).toEqual({
                id: 'section-1',
                label: 'Walls',
                expenses: [
                    { id: 'expense-1', label: 'Paint', labor: 100, material: 50, total: 150 },
                ],
                total: 150,
            });
        });

        it('should return total of 0 when expenses is empty', () => {
            const section = Object.assign(new RoomSectionEntity(), {
                id: 'section-2',
                label: 'Ceiling',
                expenses: [],
            });

            const result = service.mapSection(section);

            expect(result.total).toBe(0);
            expect(result.expenses).toEqual([]);
        });

        it('should handle undefined expenses gracefully', () => {
            const section = Object.assign(new RoomSectionEntity(), {
                id: 'section-3',
                label: 'Floor',
                expenses: undefined,
            });

            const result = service.mapSection(section);

            expect(result.total).toBe(0);
            expect(result.expenses).toEqual([]);
        });
    });

    describe('mapCategory', () => {
        it('should map a room category entity with sections to a category DTO', () => {
            const expense = Object.assign(new RoomExpenseItemEntity(), {
                id: 'expense-1',
                label: 'Paint',
                laborValue: 100,
                materialValue: 50,
                total: 200,
            });

            const section = Object.assign(new RoomSectionEntity(), {
                id: 'section-1',
                label: 'Walls',
                expenses: [expense],
            });

            const room = Object.assign(new RoomCategoryEntity(), {
                id: 'room-1',
                label: 'Living Room',
                type: BAnalysisTypeEnum.INTERIOR_EXPENSES,
                sections: [section],
            });

            const result = service.mapCategory(room);

            expect(result).toEqual({
                id: 'room-1',
                label: 'Living Room',
                type: BAnalysisTypeEnum.INTERIOR_EXPENSES,
                sections: expect.any(Array),
                total: 200,
            });
        });

        it('should return total of 0 when sections is empty', () => {
            const room = Object.assign(new RoomCategoryEntity(), {
                id: 'room-2',
                label: 'Garage',
                type: BAnalysisTypeEnum.EXTERIOR_EXPENSES,
                sections: [],
            });

            const result = service.mapCategory(room);

            expect(result.total).toBe(0);
            expect(result.sections).toEqual([]);
        });

        it('should handle undefined sections gracefully', () => {
            const room = Object.assign(new RoomCategoryEntity(), {
                id: 'room-3',
                label: 'Basement',
                type: BAnalysisTypeEnum.INTERIOR_EXPENSES,
                sections: undefined,
            });

            const result = service.mapCategory(room);

            expect(result.total).toBe(0);
            expect(result.sections).toEqual([]);
        });
    });

    describe('rCalculatorSummary', () => {
        it('should compute summary with total project cost and categories', () => {
            const expense = Object.assign(new RoomExpenseItemEntity(), {
                id: 'expense-1',
                label: 'Paint',
                laborValue: 100,
                materialValue: 50,
                total: 300,
            });

            const section = Object.assign(new RoomSectionEntity(), {
                id: 'section-1',
                label: 'Walls',
                expenses: [expense],
            });

            const room = Object.assign(new RoomCategoryEntity(), {
                id: 'room-1',
                label: 'Kitchen',
                type: BAnalysisTypeEnum.INTERIOR_EXPENSES,
                sections: [section],
            });

            const aBuilder = { rooms: [room] } as any;

            const result = service.rCalculatorSummary(aBuilder);

            expect(result.totalProjectCost).toBe(300);
            expect(result.categories).toHaveLength(1);
            expect(result.categories[0].id).toBe('room-1');
            expect(result.categories[0].total).toBe(300);
        });

        it('should return totalProjectCost of 0 when rooms is empty', () => {
            const aBuilder = { rooms: [] } as any;

            const result = service.rCalculatorSummary(aBuilder);

            expect(result.totalProjectCost).toBe(0);
            expect(result.categories).toEqual([]);
        });

        it('should handle undefined rooms gracefully', () => {
            const aBuilder = { rooms: undefined } as any;

            const result = service.rCalculatorSummary(aBuilder);

            expect(result.totalProjectCost).toBe(0);
            expect(result.categories).toEqual([]);
        });

        it('should aggregate totals across multiple rooms', () => {
            const makeRoom = (id: string, total: number) => {
                const expense = Object.assign(new RoomExpenseItemEntity(), {
                    id: `expense-${id}`,
                    label: 'Item',
                    laborValue: 0,
                    materialValue: 0,
                    total,
                });
                const section = Object.assign(new RoomSectionEntity(), {
                    id: `section-${id}`,
                    label: 'Section',
                    expenses: [expense],
                });
                return Object.assign(new RoomCategoryEntity(), {
                    id: `room-${id}`,
                    label: `Room ${id}`,
                    type: BAnalysisTypeEnum.INTERIOR_EXPENSES,
                    sections: [section],
                });
            };

            const aBuilder = { rooms: [makeRoom('1', 500), makeRoom('2', 300)] } as any;

            const result = service.rCalculatorSummary(aBuilder);

            expect(result.totalProjectCost).toBe(800);
            expect(result.categories).toHaveLength(2);
        });
    });

    describe('mapRoom', () => {
        it('should flatten all expenses across sections and return room DTO', () => {
            const expense1 = Object.assign(new RoomExpenseItemEntity(), {
                id: 'expense-1',
                label: 'Paint',
                laborValue: 100,
                materialValue: 50,
                total: 200,
            });
            const expense2 = Object.assign(new RoomExpenseItemEntity(), {
                id: 'expense-2',
                label: 'Tiles',
                laborValue: 50,
                materialValue: 100,
                total: 150,
            });

            const section1 = Object.assign(new RoomSectionEntity(), {
                id: 'section-1',
                label: 'Walls',
                expenses: [expense1],
            });
            const section2 = Object.assign(new RoomSectionEntity(), {
                id: 'section-2',
                label: 'Floor',
                expenses: [expense2],
            });

            const room = Object.assign(new RoomCategoryEntity(), {
                id: 'room-1',
                label: 'Kitchen',
                type: BAnalysisTypeEnum.INTERIOR_EXPENSES,
                sections: [section1, section2],
            });

            const result = service.mapRoom(room);

            expect(result).toEqual({
                id: 'room-1',
                label: 'Kitchen',
                type: BAnalysisTypeEnum.INTERIOR_EXPENSES,
                expenses: [
                    { id: 'expense-1', label: 'Paint', labor: 100, material: 50, total: 200 },
                    { id: 'expense-2', label: 'Tiles', labor: 50, material: 100, total: 150 },
                ],
                total: 350,
            });
        });

        it('should return total of 0 when sections is empty', () => {
            const room = Object.assign(new RoomCategoryEntity(), {
                id: 'room-2',
                label: 'Garage',
                type: BAnalysisTypeEnum.EXTERIOR_EXPENSES,
                sections: [],
            });

            const result = service.mapRoom(room);

            expect(result.total).toBe(0);
            expect(result.expenses).toEqual([]);
        });

        it('should handle undefined sections gracefully', () => {
            const room = Object.assign(new RoomCategoryEntity(), {
                id: 'room-3',
                label: 'Basement',
                type: BAnalysisTypeEnum.INTERIOR_EXPENSES,
                sections: undefined,
            });

            const result = service.mapRoom(room);

            expect(result.total).toBe(0);
            expect(result.expenses).toEqual([]);
        });

        it('should handle sections with undefined expenses gracefully', () => {
            const section = Object.assign(new RoomSectionEntity(), {
                id: 'section-1',
                label: 'Walls',
                expenses: undefined,
            });
            const room = Object.assign(new RoomCategoryEntity(), {
                id: 'room-4',
                label: 'Living Room',
                type: BAnalysisTypeEnum.INTERIOR_EXPENSES,
                sections: [section],
            });

            const result = service.mapRoom(room);

            expect(result.total).toBe(0);
            expect(result.expenses).toEqual([]);
        });
    });

    describe('getPunchList', () => {
        it('should compute punch list with total project cost and rooms', () => {
            const expense = Object.assign(new RoomExpenseItemEntity(), {
                id: 'expense-1',
                label: 'Paint',
                laborValue: 100,
                materialValue: 50,
                total: 300,
            });

            const section = Object.assign(new RoomSectionEntity(), {
                id: 'section-1',
                label: 'Walls',
                expenses: [expense],
            });

            const room = Object.assign(new RoomCategoryEntity(), {
                id: 'room-1',
                label: 'Kitchen',
                type: BAnalysisTypeEnum.INTERIOR_EXPENSES,
                sections: [section],
            });

            const aBuilder = { rooms: [room] } as any;

            const result = service.getPunchList(aBuilder);

            expect(result.totalProjectCost).toBe(300);
            expect(result.rooms).toHaveLength(1);
            expect(result.rooms[0].id).toBe('room-1');
            expect(result.rooms[0].total).toBe(300);
            expect(result.rooms[0].expenses).toHaveLength(1);
        });

        it('should return totalProjectCost of 0 when rooms is empty', () => {
            const aBuilder = { rooms: [] } as any;

            const result = service.getPunchList(aBuilder);

            expect(result.totalProjectCost).toBe(0);
            expect(result.rooms).toEqual([]);
        });

        it('should handle undefined rooms gracefully', () => {
            const aBuilder = { rooms: undefined } as any;

            const result = service.getPunchList(aBuilder);

            expect(result.totalProjectCost).toBe(0);
            expect(result.rooms).toEqual([]);
        });

        it('should aggregate totals across multiple rooms', () => {
            const makeRoom = (id: string, total: number) => {
                const expense = Object.assign(new RoomExpenseItemEntity(), {
                    id: `expense-${id}`,
                    label: 'Item',
                    laborValue: 0,
                    materialValue: 0,
                    total,
                });
                const section = Object.assign(new RoomSectionEntity(), {
                    id: `section-${id}`,
                    label: 'Section',
                    expenses: [expense],
                });
                return Object.assign(new RoomCategoryEntity(), {
                    id: `room-${id}`,
                    label: `Room ${id}`,
                    type: BAnalysisTypeEnum.INTERIOR_EXPENSES,
                    sections: [section],
                });
            };

            const aBuilder = { rooms: [makeRoom('1', 400), makeRoom('2', 600)] } as any;

            const result = service.getPunchList(aBuilder);

            expect(result.totalProjectCost).toBe(1000);
            expect(result.rooms).toHaveLength(2);
        });
    });
});
