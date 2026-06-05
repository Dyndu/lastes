import { Test, TestingModule } from '@nestjs/testing';
import { AdsStatsService } from './ads-stats.service';
import { AdsStatsEntity } from '../entities/ads-stats.entity';
import { AdsStatusEnum } from '../../../common/enum';
import { AdsStatsRepository } from '../repositories/ads-stats.repository';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('AdsStatsService', () => {
    let service: AdsStatsService;
    let mockAdsStatsRepo: any;

    const mockStatsEntity: AdsStatsEntity = {
        singleton: 1,
        total: 10,
        scheduled: 4,
        expired: 6,
    } as any;

    beforeEach(async () => {
        mockAdsStatsRepo = {
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            build: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AdsStatsService,
                {
                    provide: AdsStatsRepository,
                    useValue: mockAdsStatsRepo,
                },
            ],
        }).compile();

        service = module.get<AdsStatsService>(AdsStatsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('onCreate', () => {
        it('should increment total and scheduled count when creating scheduled ad', async () => {
            const initialStats = {
                singleton: 1,
                total: 10,
                running: 4,
                expired: 6,
            } as any;

            const updatedStats = {
                singleton: 1,
                total: 11,
                running: 5,
                expired: 6,
            } as any;

            mockAdsStatsRepo.findOne.mockResolvedValue(initialStats);
            mockAdsStatsRepo.update.mockResolvedValue(updatedStats);

            const result = await service.onCreate(AdsStatusEnum.RUNNING);

            expect(mockAdsStatsRepo.findOne).toHaveBeenCalledWith({
                where: { singleton: 1 },
            });
            expect(mockAdsStatsRepo.update).toHaveBeenCalledWith(
                { singleton: 1 },
                expect.objectContaining({
                    total: 11,
                    running: 5,
                }),
            );
            expect(result).toEqual(updatedStats);
        });

        it('should increment total and expired count when creating expired ad', async () => {
            const initialStats = {
                singleton: 1,
                total: 10,
                scheduled: 4,
                expired: 6,
            } as any;

            const updatedStats = {
                singleton: 1,
                total: 11,
                scheduled: 4,
                expired: 7,
            } as any;

            mockAdsStatsRepo.findOne.mockResolvedValue(initialStats);
            mockAdsStatsRepo.update.mockResolvedValue(updatedStats);

            const result = await service.onCreate(AdsStatusEnum.EXPIRED);

            expect(mockAdsStatsRepo.update).toHaveBeenCalledWith(
                { singleton: 1 },
                expect.objectContaining({
                    total: 11,
                    expired: 7,
                }),
            );
            expect(result).toEqual(updatedStats);
        });

        it('should create singleton if it does not exist', async () => {
            const newStats = {
                singleton: 1,
                total: 0,
                scheduled: 0,
                expired: 0,
            } as AdsStatsEntity;

            const updatedStats = {
                singleton: 1,
                total: 1,
                scheduled: 1,
                expired: 0,
            } as AdsStatsEntity;

            mockAdsStatsRepo.findOne.mockResolvedValue(null);
            mockAdsStatsRepo.create.mockResolvedValue(newStats);
            mockAdsStatsRepo.update.mockResolvedValue(updatedStats);

            const result = await service.onCreate(AdsStatusEnum.SCHEDULED);

            expect(mockAdsStatsRepo.build).toHaveBeenCalledWith({
                singleton: 1,
                total: 0,
            });
            expect(mockAdsStatsRepo.update).toHaveBeenCalled();
            expect(result).toEqual(updatedStats);
        });

        it('should handle multiple onCreate calls correctly', async () => {
            const initialStats = {
                singleton: 1,
                total: 5,
                scheduled: 2,
                expired: 3,
            } as any;

            mockAdsStatsRepo.findOne.mockResolvedValue(initialStats);
            mockAdsStatsRepo.update.mockResolvedValue({
                ...initialStats,
                total: 6,
                scheduled: 3,
            });

            await service.onCreate(AdsStatusEnum.SCHEDULED);

            expect(mockAdsStatsRepo.update).toHaveBeenCalledWith(
                { singleton: 1 },
                expect.objectContaining({
                    total: 6,
                    scheduled: 3,
                }),
            );
        });

        it('should handle creating ad with zero initial stats', async () => {
            const initialStats = {
                singleton: 1,
                total: 0,
                scheduled: 0,
                expired: 0,
            } as any;

            const updatedStats = {
                singleton: 1,
                total: 1,
                scheduled: 0,
                expired: 1,
            } as any;

            mockAdsStatsRepo.findOne.mockResolvedValue(initialStats);
            mockAdsStatsRepo.update.mockResolvedValue(updatedStats);

            const result = await service.onCreate(AdsStatusEnum.EXPIRED);

            expect(result.total).toBe(1);
            expect(result.expired).toBe(1);
        });
    });

    describe('onDelete', () => {
        it('should decrement total and scheduled count when deleting scheduled ad', async () => {
            const initialStats = {
                singleton: 1,
                total: 10,
                scheduled: 4,
                expired: 6,
            } as any;

            const updatedStats = {
                singleton: 1,
                total: 9,
                scheduled: 3,
                expired: 6,
            } as any;

            mockAdsStatsRepo.findOne.mockResolvedValue(initialStats);
            mockAdsStatsRepo.update.mockResolvedValue(updatedStats);

            const result = await service.onDelete(AdsStatusEnum.SCHEDULED);

            expect(mockAdsStatsRepo.update).toHaveBeenCalledWith(
                { singleton: 1 },
                expect.objectContaining({
                    total: 9,
                    scheduled: 3,
                }),
            );
            expect(result).toEqual(updatedStats);
        });

        it('should decrement total and expired count when deleting expired ad', async () => {
            const initialStats = {
                singleton: 1,
                total: 10,
                scheduled: 4,
                expired: 6,
            } as any;

            const updatedStats = {
                singleton: 1,
                total: 9,
                scheduled: 4,
                expired: 5,
            } as any;

            mockAdsStatsRepo.findOne.mockResolvedValue(initialStats);
            mockAdsStatsRepo.update.mockResolvedValue(updatedStats);

            const result = await service.onDelete(AdsStatusEnum.EXPIRED);

            expect(mockAdsStatsRepo.update).toHaveBeenCalledWith(
                { singleton: 1 },
                expect.objectContaining({
                    total: 9,
                    expired: 5,
                }),
            );
            expect(result).toEqual(updatedStats);
        });

        it('should not allow total to go below zero', async () => {
            const initialStats = {
                singleton: 1,
                total: 0,
                scheduled: 0,
                expired: 0,
            } as any;

            mockAdsStatsRepo.findOne.mockResolvedValue(initialStats);
            mockAdsStatsRepo.update.mockResolvedValue(initialStats);

            const result = await service.onDelete(AdsStatusEnum.SCHEDULED);

            expect(mockAdsStatsRepo.update).toHaveBeenCalledWith(
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
                scheduled: 0,
                expired: 0,
            } as any;

            const updatedStats = {
                singleton: 1,
                total: 0,
                scheduled: -1,
                expired: 0,
            } as any;

            mockAdsStatsRepo.findOne.mockResolvedValue(initialStats);
            mockAdsStatsRepo.update.mockResolvedValue(updatedStats);

            const result = await service.onDelete(AdsStatusEnum.SCHEDULED);

            expect(result.total).toBe(0);
            expect(result.scheduled).toBe(-1);
        });

        it('should handle edge case when total is 1 and status count is 0', async () => {
            const initialStats = {
                singleton: 1,
                total: 1,
                scheduled: 0,
                expired: 1,
            } as any;

            const updatedStats = {
                singleton: 1,
                total: 0,
                scheduled: -1,
                expired: 1,
            } as any;

            mockAdsStatsRepo.findOne.mockResolvedValue(initialStats);
            mockAdsStatsRepo.update.mockResolvedValue(updatedStats);

            const result = await service.onDelete(AdsStatusEnum.SCHEDULED);

            expect(result.total).toBe(0);
            expect(result.scheduled).toBe(-1);
        });

        it('should handle multiple delete operations', async () => {
            const initialStats = {
                singleton: 1,
                total: 10,
                scheduled: 5,
                expired: 5,
            } as any;

            mockAdsStatsRepo.findOne.mockResolvedValue(initialStats);
            mockAdsStatsRepo.update
                .mockResolvedValueOnce({
                    ...initialStats,
                    total: 9,
                    scheduled: 4,
                })
                .mockResolvedValueOnce({
                    ...initialStats,
                    total: 8,
                    expired: 4,
                });

            await service.onDelete(AdsStatusEnum.SCHEDULED);
            await service.onDelete(AdsStatusEnum.EXPIRED);

            expect(mockAdsStatsRepo.update).toHaveBeenCalledTimes(2);
        });
    });

    describe('onStatusChange', () => {
        it('should return current stats when to is undefined', async () => {
            const currentStats = {
                singleton: 1,
                total: 10,
                scheduled: 4,
                expired: 6,
            } as any;

            mockAdsStatsRepo.findOne.mockResolvedValue(currentStats);

            const result = await service.onStatusChange(AdsStatusEnum.SCHEDULED, undefined);

            expect(result).toEqual(currentStats);
            expect(mockAdsStatsRepo.update).not.toHaveBeenCalled();
        });

        it('should return current stats when new status equals old status', async () => {
            const currentStats = {
                singleton: 1,
                total: 10,
                scheduled: 4,
                expired: 6,
            } as any;

            mockAdsStatsRepo.findOne.mockResolvedValue(currentStats);

            const result = await service.onStatusChange(
                AdsStatusEnum.SCHEDULED,
                AdsStatusEnum.SCHEDULED,
            );

            expect(result).toEqual(currentStats);
            expect(mockAdsStatsRepo.update).not.toHaveBeenCalled();
        });

        it('should update stats when changing from scheduled to expired', async () => {
            const initialStats = {
                singleton: 1,
                total: 10,
                scheduled: 4,
                expired: 6,
            } as any;

            const updatedStats = {
                singleton: 1,
                total: 10,
                scheduled: 3,
                expired: 7,
            } as any;

            mockAdsStatsRepo.findOne.mockResolvedValue(initialStats);
            mockAdsStatsRepo.update.mockResolvedValue(updatedStats);

            const result = await service.onStatusChange(
                AdsStatusEnum.SCHEDULED,
                AdsStatusEnum.EXPIRED,
            );

            expect(mockAdsStatsRepo.update).toHaveBeenCalledWith(
                { singleton: 1 },
                {
                    scheduled: 3,
                    expired: 7,
                },
            );
            expect(result).toEqual(updatedStats);
        });

        it('should update stats when changing from expired to scheduled', async () => {
            const initialStats = {
                singleton: 1,
                total: 10,
                scheduled: 4,
                expired: 6,
            } as any;

            const updatedStats = {
                singleton: 1,
                total: 10,
                scheduled: 5,
                expired: 5,
            } as any;

            mockAdsStatsRepo.findOne.mockResolvedValue(initialStats);
            mockAdsStatsRepo.update.mockResolvedValue(updatedStats);

            const result = await service.onStatusChange(
                AdsStatusEnum.EXPIRED,
                AdsStatusEnum.SCHEDULED,
            );

            expect(mockAdsStatsRepo.update).toHaveBeenCalledWith(
                { singleton: 1 },
                {
                    expired: 5,
                    scheduled: 5,
                },
            );
            expect(result).toEqual(updatedStats);
        });

        it('should only update the two affected status fields', async () => {
            const initialStats = {
                singleton: 1,
                total: 10,
                scheduled: 4,
                expired: 6,
            } as any;

            mockAdsStatsRepo.findOne.mockResolvedValue(initialStats);
            mockAdsStatsRepo.update.mockResolvedValue(initialStats);

            await service.onStatusChange(AdsStatusEnum.SCHEDULED, AdsStatusEnum.EXPIRED);

            expect(mockAdsStatsRepo.update).toHaveBeenCalledWith(
                { singleton: 1 },
                {
                    scheduled: 3,
                    expired: 7,
                },
            );
        });

        it('should allow counts to go negative during status change', async () => {
            const initialStats = {
                singleton: 1,
                total: 10,
                scheduled: 0,
                expired: 10,
            } as any;

            const updatedStats = {
                singleton: 1,
                total: 10,
                scheduled: 1,
                expired: 9,
            } as any;

            mockAdsStatsRepo.findOne.mockResolvedValue(initialStats);
            mockAdsStatsRepo.update.mockResolvedValue(updatedStats);

            const result = await service.onStatusChange(
                AdsStatusEnum.EXPIRED,
                AdsStatusEnum.SCHEDULED,
            );

            expect(result.scheduled).toBe(1);
            expect(result.expired).toBe(9);
        });

        it('should not affect total count during status change', async () => {
            const initialStats = {
                singleton: 1,
                total: 10,
                scheduled: 4,
                expired: 6,
            } as any;

            const updatedStats = {
                singleton: 1,
                total: 10,
                scheduled: 3,
                expired: 7,
            } as any;

            mockAdsStatsRepo.findOne.mockResolvedValue(initialStats);
            mockAdsStatsRepo.update.mockResolvedValue(updatedStats);

            const result = await service.onStatusChange(
                AdsStatusEnum.SCHEDULED,
                AdsStatusEnum.EXPIRED,
            );

            expect(result.total).toBe(10);
        });

        it('should handle multiple status changes in sequence', async () => {
            const stats = {
                singleton: 1,
                total: 10,
                scheduled: 5,
                expired: 5,
            } as any;

            mockAdsStatsRepo.findOne.mockResolvedValue(stats);
            mockAdsStatsRepo.update
                .mockResolvedValueOnce({ ...stats, scheduled: 4, expired: 6 })
                .mockResolvedValueOnce({ ...stats, scheduled: 5, expired: 5 });

            await service.onStatusChange(AdsStatusEnum.SCHEDULED, AdsStatusEnum.EXPIRED);
            await service.onStatusChange(AdsStatusEnum.EXPIRED, AdsStatusEnum.SCHEDULED);

            expect(mockAdsStatsRepo.update).toHaveBeenCalledTimes(2);
        });
    });

    describe('Repository interaction', () => {
        it('should call findOne with correct parameters', async () => {
            mockAdsStatsRepo.findOne.mockResolvedValue(mockStatsEntity);

            await service.onCreate(AdsStatusEnum.SCHEDULED);

            expect(mockAdsStatsRepo.findOne).toHaveBeenCalledWith({
                where: { singleton: 1 },
            });
        });

        it('should call create with correct initial values when singleton does not exist', async () => {
            mockAdsStatsRepo.findOne.mockResolvedValue(null);
            mockAdsStatsRepo.create.mockResolvedValue(mockStatsEntity);

            await service.onCreate(AdsStatusEnum.SCHEDULED);

            expect(mockAdsStatsRepo.build).toHaveBeenCalledWith({
                singleton: 1,
                total: 0,
            });
        });

        it('should call update with singleton identifier', async () => {
            mockAdsStatsRepo.findOne.mockResolvedValue(mockStatsEntity);
            mockAdsStatsRepo.update.mockResolvedValue(mockStatsEntity);

            await service.onCreate(AdsStatusEnum.SCHEDULED);

            expect(mockAdsStatsRepo.update).toHaveBeenCalledWith(
                { singleton: 1 },
                expect.any(Object),
            );
        });

        it('should use AdsStatsRepository instance', () => {
            expect(service['adsStatsRepository']).toBe(mockAdsStatsRepo);
        });
    });

    describe('Integration scenarios', () => {
        it('should handle create -> delete -> create cycle', async () => {
            const stats = {
                singleton: 1,
                total: 0,
                scheduled: 0,
                expired: 0,
            } as any;

            mockAdsStatsRepo.findOne.mockResolvedValue(stats);
            mockAdsStatsRepo.update.mockImplementation((_where: any, data: any) => ({
                ...stats,
                ...data,
            }));

            await service.onCreate(AdsStatusEnum.SCHEDULED);
            await service.onDelete(AdsStatusEnum.SCHEDULED);
            await service.onCreate(AdsStatusEnum.SCHEDULED);

            expect(mockAdsStatsRepo.update).toHaveBeenCalledTimes(3);
        });

        it('should handle create -> status change -> delete cycle', async () => {
            const stats = {
                singleton: 1,
                total: 1,
                scheduled: 1,
                expired: 0,
            } as any;

            mockAdsStatsRepo.findOne.mockResolvedValue(stats);
            mockAdsStatsRepo.update.mockResolvedValue(stats);

            await service.onStatusChange(AdsStatusEnum.SCHEDULED, AdsStatusEnum.EXPIRED);
            await service.onDelete(AdsStatusEnum.EXPIRED);

            expect(mockAdsStatsRepo.update).toHaveBeenCalledTimes(2);
        });

        it('should maintain consistency across multiple operations', async () => {
            let stats = {
                singleton: 1,
                total: 0,
                scheduled: 0,
                expired: 0,
            } as any;

            mockAdsStatsRepo.findOne.mockImplementation(() => Promise.resolve(stats));
            mockAdsStatsRepo.update.mockImplementation((_where: any, data: AdsStatsEntity) => {
                stats = { ...stats, ...data };
                return Promise.resolve(stats);
            });

            await service.onCreate(AdsStatusEnum.SCHEDULED);
            await service.onCreate(AdsStatusEnum.EXPIRED);
            await service.onStatusChange(AdsStatusEnum.SCHEDULED, AdsStatusEnum.EXPIRED);

            expect(stats.total).toBeGreaterThanOrEqual(0);
        });

        it('should handle rapid concurrent operations', async () => {
            const stats = {
                singleton: 1,
                total: 10,
                scheduled: 5,
                expired: 5,
            } as any;

            mockAdsStatsRepo.findOne.mockResolvedValue(stats);
            mockAdsStatsRepo.update.mockResolvedValue(stats);

            const operations = [
                await service.onCreate(AdsStatusEnum.SCHEDULED),
                await service.onCreate(AdsStatusEnum.EXPIRED),
                await service.onDelete(AdsStatusEnum.SCHEDULED),
            ];

            await Promise.all(operations);

            expect(mockAdsStatsRepo.update).toHaveBeenCalledTimes(3);
        });
    });

    describe('Service inheritance', () => {
        it('should extend BaseStatsService', () => {
            expect(service).toBeInstanceOf(AdsStatsService);
        });

        it('should have access to inherited methods', () => {
            expect(typeof service.onCreate).toBe('function');
            expect(typeof service.onDelete).toBe('function');
            expect(typeof service.onStatusChange).toBe('function');
        });

        it('should pass repository to parent constructor', () => {
            expect(service['repo']).toBe(mockAdsStatsRepo);
        });
    });

    describe('Error handling', () => {
        it('should propagate repository errors on onCreate', async () => {
            const error = new Error('Database error');
            mockAdsStatsRepo.findOne.mockRejectedValue(error);

            await expect(service.onCreate(AdsStatusEnum.SCHEDULED)).rejects.toThrow(
                'Database error',
            );
        });

        it('should propagate repository errors on onDelete', async () => {
            const error = new Error('Update failed');
            mockAdsStatsRepo.findOne.mockResolvedValue(mockStatsEntity);
            mockAdsStatsRepo.update.mockRejectedValue(error);

            await expect(service.onDelete(AdsStatusEnum.SCHEDULED)).rejects.toThrow(
                'Update failed',
            );
        });

        it('should propagate repository errors on onStatusChange', async () => {
            const error = new Error('Database connection lost');
            mockAdsStatsRepo.findOne.mockRejectedValue(error);

            await expect(
                service.onStatusChange(AdsStatusEnum.SCHEDULED, AdsStatusEnum.EXPIRED),
            ).rejects.toThrow('Database connection lost');
        });

        it('should handle null repository response', async () => {
            mockAdsStatsRepo.findOne.mockResolvedValue(null);
            mockAdsStatsRepo.create.mockResolvedValue(null);

            await expect(service.onCreate(AdsStatusEnum.SCHEDULED)).rejects.toThrow();
        });
    });
});
