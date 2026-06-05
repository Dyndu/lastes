import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GuidesStatsRepository } from './guides-stats.repository';
import { GuidesStatsEntity } from '../entities';

describe('GuidesStatsRepository', () => {
    let guideStatRepository: GuidesStatsRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GuidesStatsRepository,
                {
                    provide: getRepositoryToken(GuidesStatsEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        guideStatRepository = module.get<GuidesStatsRepository>(GuidesStatsRepository);
    });

    it('should be defined', () => {
        expect(guideStatRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(guideStatRepository['logger']).toBeDefined();
    });
});
