import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AnalysisUsageRepository } from './analysis-usage.repository';
import { AnalysisUsageEntity } from '../entities';

describe('AnalysisUsageRepository', () => {
    let analysisUsageRepository: AnalysisUsageRepository;

    const mockRepository = {};
    const mockEntityManager = {} as EntityManager;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AnalysisUsageRepository,
                {
                    provide: getRepositoryToken(AnalysisUsageEntity),
                    useValue: mockRepository,
                },
                { provide: EntityManager, useValue: mockEntityManager },
            ],
        }).compile();

        analysisUsageRepository = module.get<AnalysisUsageRepository>(AnalysisUsageRepository);
    });

    it('should be defined', () => {
        expect(analysisUsageRepository).toBeDefined();
    });

    it('should have a logger', () => {
        expect(analysisUsageRepository['logger']).toBeDefined();
    });
});
