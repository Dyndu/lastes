import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AdsStatsEntity } from '../entities/ads-stats.entity';
import { AdsStatsRepository } from './ads-stats.repository';

describe('AdsStatsRepository', () => {
    let adsStatRepository: AdsStatsRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AdsStatsRepository,
                {
                    provide: getRepositoryToken(AdsStatsEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        adsStatRepository = module.get<AdsStatsRepository>(AdsStatsRepository);
    });

    it('should be defined', () => {
        expect(adsStatRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(adsStatRepository['logger']).toBeDefined();
    });
});
