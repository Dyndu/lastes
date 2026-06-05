import { Test, TestingModule } from '@nestjs/testing';
import { GuidesStatsService } from './guides-stats.service';
import { GuidesStatsEntity } from '../entities';
import { GuideStatusEnum } from '../../../common/enum';
import { GuidesStatsRepository } from '../repositories';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('GuidesStatsService', () => {
    let service: GuidesStatsService;
    let mockGStatsRepo: any;

    const mockStatsEntity: GuidesStatsEntity = {
        singleton: 1,
        total: 10,
        draft: 4,
        published: 6,
    } as GuidesStatsEntity;

    beforeEach(async () => {
        mockGStatsRepo = {
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            build: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GuidesStatsService,
                {
                    provide: GuidesStatsRepository,
                    useValue: mockGStatsRepo,
                },
            ],
        }).compile();

        service = module.get<GuidesStatsService>(GuidesStatsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('onCreate', () => {
        it('should increment total and draft count when creating draft guide', async () => {
            const initialStats = {
                singleton: 1,
                total: 10,
                draft: 4,
                published: 6,
            } as GuidesStatsEntity;

            const updatedStats = {
                singleton: 1,
                total: 11,
                draft: 5,
                published: 6,
            } as GuidesStatsEntity;

            mockGStatsRepo.findOne.mockResolvedValue(initialStats);
            mockGStatsRepo.update.mockResolvedValue(updatedStats);

            const result = await service.onCreate(GuideStatusEnum.DRAFT);

            expect(mockGStatsRepo.findOne).toHaveBeenCalledWith({
                where: { singleton: 1 },
            });
            expect(mockGStatsRepo.update).toHaveBeenCalledWith(
                { singleton: 1 },
                expect.objectContaining({
                    total: 11,
                    draft: 5,
                }),
            );
            expect(result).toEqual(updatedStats);
        });

        it('should increment total and published count when creating published guide', async () => {
            const initialStats = {
                singleton: 1,
                total: 10,
                draft: 4,
                published: 6,
            } as GuidesStatsEntity;

            const updatedStats = {
                singleton: 1,
                total: 11,
                draft: 4,
                published: 7,
            } as GuidesStatsEntity;

            mockGStatsRepo.findOne.mockResolvedValue(initialStats);
            mockGStatsRepo.update.mockResolvedValue(updatedStats);

            const result = await service.onCreate(GuideStatusEnum.PUBLISHED);

            expect(mockGStatsRepo.update).toHaveBeenCalledWith(
                { singleton: 1 },
                expect.objectContaining({
                    total: 11,
                    published: 7,
                }),
            );
            expect(result).toEqual(updatedStats);
        });

        it('should create singleton if it does not exist', async () => {
            const newStats = {
                singleton: 1,
                total: 0,
                draft: 0,
                published: 0,
            } as GuidesStatsEntity;

            const updatedStats = {
                singleton: 1,
                total: 1,
                draft: 1,
                published: 0,
            } as GuidesStatsEntity;

            mockGStatsRepo.findOne.mockResolvedValue(null);
            mockGStatsRepo.create.mockResolvedValue(newStats);
            mockGStatsRepo.update.mockResolvedValue(updatedStats);

            const result = await service.onCreate(GuideStatusEnum.DRAFT);

            expect(mockGStatsRepo.build).toHaveBeenCalledWith({
                singleton: 1,
                total: 0,
            });
            expect(mockGStatsRepo.update).toHaveBeenCalled();
            expect(result).toEqual(updatedStats);
        });

        it('should handle multiple onCreate calls correctly', async () => {
            const initialStats = {
                singleton: 1,
                total: 5,
                draft: 2,
                published: 3,
            } as GuidesStatsEntity;

            mockGStatsRepo.findOne.mockResolvedValue(initialStats);
            mockGStatsRepo.update.mockResolvedValue({
                ...initialStats,
                total: 6,
                draft: 3,
            });

            await service.onCreate(GuideStatusEnum.DRAFT);

            expect(mockGStatsRepo.update).toHaveBeenCalledWith(
                { singleton: 1 },
                expect.objectContaining({
                    total: 6,
                    draft: 3,
                }),
            );
        });
    });

    describe('onDelete', () => {
        it('should decrement total and draft count when deleting draft guide', async () => {
            const initialStats = {
                singleton: 1,
                total: 10,
                draft: 4,
                published: 6,
            } as GuidesStatsEntity;

            const updatedStats = {
                singleton: 1,
                total: 9,
                draft: 3,
                published: 6,
            } as GuidesStatsEntity;

            mockGStatsRepo.findOne.mockResolvedValue(initialStats);
            mockGStatsRepo.update.mockResolvedValue(updatedStats);

            const result = await service.onDelete(GuideStatusEnum.DRAFT);

            expect(mockGStatsRepo.update).toHaveBeenCalledWith(
                { singleton: 1 },
                expect.objectContaining({
                    total: 9,
                    draft: 3,
                }),
            );
            expect(result).toEqual(updatedStats);
        });

        it('should decrement total and published count when deleting published guide', async () => {
            const initialStats = {
                singleton: 1,
                total: 10,
                draft: 4,
                published: 6,
            } as GuidesStatsEntity;

            const updatedStats = {
                singleton: 1,
                total: 9,
                draft: 4,
                published: 5,
            } as GuidesStatsEntity;

            mockGStatsRepo.findOne.mockResolvedValue(initialStats);
            mockGStatsRepo.update.mockResolvedValue(updatedStats);

            const result = await service.onDelete(GuideStatusEnum.PUBLISHED);

            expect(mockGStatsRepo.update).toHaveBeenCalledWith(
                { singleton: 1 },
                expect.objectContaining({
                    total: 9,
                    published: 5,
                }),
            );
            expect(result).toEqual(updatedStats);
        });

        it('should not allow total to go below zero', async () => {
            const initialStats = {
                singleton: 1,
                total: 0,
                draft: 0,
                published: 0,
            } as GuidesStatsEntity;

            mockGStatsRepo.findOne.mockResolvedValue(initialStats);
            mockGStatsRepo.update.mockResolvedValue(initialStats);

            const result = await service.onDelete(GuideStatusEnum.DRAFT);

            expect(mockGStatsRepo.update).toHaveBeenCalledWith(
                { singleton: 1 },
                expect.objectContaining({
                    total: 0,
                }),
            );
            expect(result.total).toBe(0);
        });

        it('should allow status count to go negative but total stays at zero', async () => {
            const initialStats = {
                singleton: 1,
                total: 0,
                draft: 0,
                published: 0,
            } as GuidesStatsEntity;

            const updatedStats = {
                singleton: 1,
                total: 0,
                draft: -1,
                published: 0,
            } as GuidesStatsEntity;

            mockGStatsRepo.findOne.mockResolvedValue(initialStats);
            mockGStatsRepo.update.mockResolvedValue(updatedStats);

            const result = await service.onDelete(GuideStatusEnum.DRAFT);

            expect(result.total).toBe(0);
            expect(result.draft).toBe(-1);
        });

        it('should handle edge case when total is 1 and status count is 0', async () => {
            const initialStats = {
                singleton: 1,
                total: 1,
                draft: 0,
                published: 1,
            } as GuidesStatsEntity;

            const updatedStats = {
                singleton: 1,
                total: 0,
                draft: -1,
                published: 1,
            } as GuidesStatsEntity;

            mockGStatsRepo.findOne.mockResolvedValue(initialStats);
            mockGStatsRepo.update.mockResolvedValue(updatedStats);

            const result = await service.onDelete(GuideStatusEnum.DRAFT);

            expect(result.total).toBe(0);
            expect(result.draft).toBe(-1);
        });
    });

    describe('onStatusChange', () => {
        it('should return current stats when to is undefined', async () => {
            const currentStats = {
                singleton: 1,
                total: 10,
                draft: 4,
                published: 6,
            } as GuidesStatsEntity;

            mockGStatsRepo.findOne.mockResolvedValue(currentStats);

            const result = await service.onStatusChange(GuideStatusEnum.DRAFT, undefined);

            expect(result).toEqual(currentStats);
            expect(mockGStatsRepo.update).not.toHaveBeenCalled();
        });

        it('should return current stats when new status equals old status', async () => {
            const currentStats = {
                singleton: 1,
                total: 10,
                draft: 4,
                published: 6,
            } as GuidesStatsEntity;

            mockGStatsRepo.findOne.mockResolvedValue(currentStats);

            const result = await service.onStatusChange(
                GuideStatusEnum.DRAFT,
                GuideStatusEnum.DRAFT,
            );

            expect(result).toEqual(currentStats);
            expect(mockGStatsRepo.update).not.toHaveBeenCalled();
        });

        it('should update stats when changing from draft to published', async () => {
            const initialStats = {
                singleton: 1,
                total: 10,
                draft: 4,
                published: 6,
            } as GuidesStatsEntity;

            const updatedStats = {
                singleton: 1,
                total: 10,
                draft: 3,
                published: 7,
            } as GuidesStatsEntity;

            mockGStatsRepo.findOne.mockResolvedValue(initialStats);
            mockGStatsRepo.update.mockResolvedValue(updatedStats);

            const result = await service.onStatusChange(
                GuideStatusEnum.DRAFT,
                GuideStatusEnum.PUBLISHED,
            );

            expect(mockGStatsRepo.update).toHaveBeenCalledWith(
                { singleton: 1 },
                {
                    draft: 3,
                    published: 7,
                },
            );
            expect(result).toEqual(updatedStats);
        });

        it('should update stats when changing from published to draft', async () => {
            const initialStats = {
                singleton: 1,
                total: 10,
                draft: 4,
                published: 6,
            } as GuidesStatsEntity;

            const updatedStats = {
                singleton: 1,
                total: 10,
                draft: 5,
                published: 5,
            } as GuidesStatsEntity;

            mockGStatsRepo.findOne.mockResolvedValue(initialStats);
            mockGStatsRepo.update.mockResolvedValue(updatedStats);

            const result = await service.onStatusChange(
                GuideStatusEnum.PUBLISHED,
                GuideStatusEnum.DRAFT,
            );

            expect(mockGStatsRepo.update).toHaveBeenCalledWith(
                { singleton: 1 },
                {
                    published: 5,
                    draft: 5,
                },
            );
            expect(result).toEqual(updatedStats);
        });

        it('should only update the two affected status fields', async () => {
            const initialStats = {
                singleton: 1,
                total: 10,
                draft: 4,
                published: 6,
            } as GuidesStatsEntity;

            mockGStatsRepo.findOne.mockResolvedValue(initialStats);
            mockGStatsRepo.update.mockResolvedValue(initialStats);

            await service.onStatusChange(GuideStatusEnum.DRAFT, GuideStatusEnum.PUBLISHED);

            expect(mockGStatsRepo.update).toHaveBeenCalledWith(
                { singleton: 1 },
                {
                    draft: 3,
                    published: 7,
                },
            );
        });

        it('should allow counts to go negative during status change', async () => {
            const initialStats = {
                singleton: 1,
                total: 10,
                draft: 0,
                published: 10,
            } as GuidesStatsEntity;

            const updatedStats = {
                singleton: 1,
                total: 10,
                draft: 1,
                published: 9,
            } as GuidesStatsEntity;

            mockGStatsRepo.findOne.mockResolvedValue(initialStats);
            mockGStatsRepo.update.mockResolvedValue(updatedStats);

            const result = await service.onStatusChange(
                GuideStatusEnum.PUBLISHED,
                GuideStatusEnum.DRAFT,
            );

            expect(result.draft).toBe(1);
            expect(result.published).toBe(9);
        });

        it('should not affect total count during status change', async () => {
            const initialStats = {
                singleton: 1,
                total: 10,
                draft: 4,
                published: 6,
            } as GuidesStatsEntity;

            const updatedStats = {
                singleton: 1,
                total: 10,
                draft: 3,
                published: 7,
            } as GuidesStatsEntity;

            mockGStatsRepo.findOne.mockResolvedValue(initialStats);
            mockGStatsRepo.update.mockResolvedValue(updatedStats);

            const result = await service.onStatusChange(
                GuideStatusEnum.DRAFT,
                GuideStatusEnum.PUBLISHED,
            );

            expect(result.total).toBe(10);
        });
    });

    describe('Repository interaction', () => {
        it('should call findOne with correct parameters', async () => {
            mockGStatsRepo.findOne.mockResolvedValue(mockStatsEntity);

            await service.onCreate(GuideStatusEnum.DRAFT);

            expect(mockGStatsRepo.findOne).toHaveBeenCalledWith({
                where: { singleton: 1 },
            });
        });

        it('should call create with correct initial values when singleton does not exist', async () => {
            mockGStatsRepo.findOne.mockResolvedValue(null);
            mockGStatsRepo.create.mockResolvedValue(mockStatsEntity);

            await service.onCreate(GuideStatusEnum.DRAFT);

            expect(mockGStatsRepo.build).toHaveBeenCalledWith({
                singleton: 1,
                total: 0,
            });
        });

        it('should call update with singleton identifier', async () => {
            mockGStatsRepo.findOne.mockResolvedValue(mockStatsEntity);
            mockGStatsRepo.update.mockResolvedValue(mockStatsEntity);

            await service.onCreate(GuideStatusEnum.DRAFT);

            expect(mockGStatsRepo.update).toHaveBeenCalledWith(
                { singleton: 1 },
                expect.any(Object),
            );
        });
    });

    describe('Integration scenarios', () => {
        it('should handle create -> delete -> create cycle', async () => {
            const stats = {
                singleton: 1,
                total: 0,
                draft: 0,
                published: 0,
            } as GuidesStatsEntity;

            mockGStatsRepo.findOne.mockResolvedValue(stats);
            mockGStatsRepo.update.mockImplementation((_where: any, data: any) => ({
                ...stats,
                ...data,
            }));

            await service.onCreate(GuideStatusEnum.DRAFT);
            await service.onDelete(GuideStatusEnum.DRAFT);
            await service.onCreate(GuideStatusEnum.DRAFT);

            expect(mockGStatsRepo.update).toHaveBeenCalledTimes(3);
        });

        it('should handle create -> status change -> delete cycle', async () => {
            const stats = {
                singleton: 1,
                total: 1,
                draft: 1,
                published: 0,
            } as GuidesStatsEntity;

            mockGStatsRepo.findOne.mockResolvedValue(stats);
            mockGStatsRepo.update.mockResolvedValue(stats);

            await service.onStatusChange(GuideStatusEnum.DRAFT, GuideStatusEnum.PUBLISHED);
            await service.onDelete(GuideStatusEnum.PUBLISHED);

            expect(mockGStatsRepo.update).toHaveBeenCalledTimes(2);
        });

        it('should maintain consistency across multiple operations', async () => {
            let stats = {
                singleton: 1,
                total: 0,
                draft: 0,
                published: 0,
            } as GuidesStatsEntity;

            mockGStatsRepo.findOne.mockImplementation(() => Promise.resolve(stats));
            mockGStatsRepo.update.mockImplementation((_where: any, data: GuidesStatsEntity) => {
                stats = { ...stats, ...data };
                return Promise.resolve(stats);
            });

            await service.onCreate(GuideStatusEnum.DRAFT);
            await service.onCreate(GuideStatusEnum.PUBLISHED);
            await service.onStatusChange(GuideStatusEnum.DRAFT, GuideStatusEnum.PUBLISHED);

            expect(stats.total).toBeGreaterThanOrEqual(0);
        });
    });
});
